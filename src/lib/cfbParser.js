// CFB (Compound File Binary) / OLE2 parser for legacy .xls (Excel 97-2003) files.
// Extracts complete streams from the compound document so embedded images
// (which may be fragmented across non-contiguous sectors) can be reassembled.
// Also strips BIFF record headers from MSODrawing records to reconstruct
// contiguous OfficeArt/BLIP data containing the actual image bytes.

const ENDOFCHAIN = 0xfffffffe;
const FREESECT = 0xffffffff;

const MSODRAWINGGROUP = 0x00eb;
const MSODRAWING = 0x00ec;
const CONTINUE = 0x003c;

function readU32(uint8, offset) {
  return (uint8[offset] | (uint8[offset + 1] << 8) | (uint8[offset + 2] << 16) | (uint8[offset + 3] << 24)) >>> 0;
}

function readU16(uint8, offset) {
  return uint8[offset] | (uint8[offset + 1] << 8);
}

export function isCFB(uint8) {
  return (
    uint8.length >= 8 &&
    uint8[0] === 0xd0 && uint8[1] === 0xcf && uint8[2] === 0x11 && uint8[3] === 0xe0 &&
    uint8[4] === 0xa1 && uint8[5] === 0xb1 && uint8[6] === 0x1a && uint8[7] === 0xe1
  );
}

function readSectorChain(uint8, fat, startSector, sectorSize, maxLen) {
  if (startSector === ENDOFCHAIN || startSector === FREESECT) return new Uint8Array(0);
  const chunks = [];
  let sector = startSector;
  let total = 0;
  let count = 0;
  const maxSectors = fat.length + 2;
  while (sector !== ENDOFCHAIN && sector !== FREESECT && sector < fat.length && count < maxSectors) {
    const off = (sector + 1) * sectorSize;
    if (off >= uint8.length) break;
    const avail = uint8.length - off;
    const toRead = maxLen > 0 ? Math.min(sectorSize, avail, maxLen - total) : Math.min(sectorSize, avail);
    if (toRead <= 0) break;
    chunks.push(uint8.subarray(off, off + toRead));
    total += toRead;
    sector = fat[sector];
    if (sector === undefined) break;
    count++;
  }
  const result = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { result.set(c, pos); pos += c.length; }
  return result;
}

function readMiniChain(miniStream, miniFat, startSector, miniSectorSize, size) {
  if (startSector === ENDOFCHAIN || startSector === FREESECT) return new Uint8Array(0);
  const chunks = [];
  let sector = startSector;
  let total = 0;
  let count = 0;
  const maxSectors = miniFat.length + 2;
  while (sector !== ENDOFCHAIN && sector !== FREESECT && sector < miniFat.length && count < maxSectors) {
    const off = sector * miniSectorSize;
    if (off >= miniStream.length) break;
    const toRead = Math.min(miniSectorSize, miniStream.length - off, size - total);
    if (toRead <= 0) break;
    chunks.push(miniStream.subarray(off, off + toRead));
    total += toRead;
    sector = miniFat[sector];
    if (sector === undefined) break;
    count++;
  }
  const result = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { result.set(c, pos); pos += c.length; }
  return result;
}

export function parseCFB(uint8) {
  if (!isCFB(uint8)) return null;

  const sectorPower = readU16(uint8, 30);
  const sectorSize = 1 << sectorPower;
  const miniSectorPower = readU16(uint8, 32);
  const miniSectorSize = 1 << miniSectorPower;
  const miniCutoff = readU32(uint8, 56);
  const firstDirSector = readU32(uint8, 48);
  const firstMiniFatSector = readU32(uint8, 60);
  const firstDifatSector = readU32(uint8, 68);

  // Build DIFAT (list of FAT sector numbers)
  const difat = [];
  for (let i = 0; i < 109; i++) {
    const val = readU32(uint8, 76 + i * 4);
    if (val !== FREESECT && val !== ENDOFCHAIN) difat.push(val);
  }
  const difatEntriesPerSector = (sectorSize / 4) - 1;
  let difatSector = firstDifatSector;
  while (difatSector !== ENDOFCHAIN && difatSector !== FREESECT) {
    const off = (difatSector + 1) * sectorSize;
    if (off + sectorSize > uint8.length) break;
    for (let i = 0; i < difatEntriesPerSector; i++) {
      const val = readU32(uint8, off + i * 4);
      if (val !== FREESECT && val !== ENDOFCHAIN) difat.push(val);
    }
    difatSector = readU32(uint8, off + difatEntriesPerSector * 4);
  }

  // Read FAT
  const fat = [];
  for (const fs of difat) {
    const off = (fs + 1) * sectorSize;
    if (off + sectorSize > uint8.length) continue;
    for (let i = 0; i < sectorSize / 4; i++) {
      fat.push(readU32(uint8, off + i * 4));
    }
  }

  // Read directory stream
  const dirData = readSectorChain(uint8, fat, firstDirSector, sectorSize, 0);
  const numEntries = Math.floor(dirData.length / 128);
  const entries = [];
  for (let i = 0; i < numEntries; i++) {
    const base = i * 128;
    const nameLen = readU16(dirData, base + 64);
    let name = '';
    const chars = Math.max(0, Math.min((nameLen - 2) / 2, 31));
    for (let j = 0; j < chars; j++) {
      const ch = readU16(dirData, base + j * 2);
      if (ch === 0) break;
      name += String.fromCharCode(ch);
    }
    const type = dirData[base + 66];
    const startSector = readU32(dirData, base + 116);
    const size = readU32(dirData, base + 120);
    entries.push({ name, type, startSector, size });
  }

  // Read mini FAT
  const miniFat = [];
  let mfs = firstMiniFatSector;
  while (mfs !== ENDOFCHAIN && mfs !== FREESECT && mfs < fat.length) {
    const off = (mfs + 1) * sectorSize;
    if (off + sectorSize > uint8.length) break;
    for (let i = 0; i < sectorSize / 4; i++) {
      miniFat.push(readU32(uint8, off + i * 4));
    }
    mfs = fat[mfs] !== undefined ? fat[mfs] : ENDOFCHAIN;
  }

  // Read mini stream from root entry
  const root = entries.find(e => e.type === 5);
  let miniStream = new Uint8Array(0);
  if (root && root.startSector !== ENDOFCHAIN) {
    miniStream = readSectorChain(uint8, fat, root.startSector, sectorSize, root.size);
  }

  // Extract all streams
  const streams = [];
  for (const e of entries) {
    if (e.type !== 2) continue; // only stream entries
    let data;
    if (e.size < miniCutoff && miniStream.length > 0) {
      data = readMiniChain(miniStream, miniFat, e.startSector, miniSectorSize, e.size);
    } else {
      data = readSectorChain(uint8, fat, e.startSector, sectorSize, e.size);
    }
    if (data.length > 0) streams.push({ name: e.name, data });
  }

  return streams;
}

// Strip BIFF record headers from MSODrawing / MSODrawingGroup records and
// their CONTINUE records, returning concatenated OfficeArt data blocks.
// This reconstructs contiguous image data that was split across BIFF records
// (each BIFF record has a 4-byte header: 2 bytes type + 2 bytes length that
// would otherwise interrupt the image byte stream).
export function extractMsodrawingData(stream) {
  const groups = [];
  let current = null;
  let off = 0;
  const len = stream.length;

  while (off + 4 <= len) {
    const type = stream[off] | (stream[off + 1] << 8);
    const recLen = stream[off + 2] | (stream[off + 3] << 8);
    off += 4;
    // Don't break on zero-length records (EOF, BLANK, etc.) — skip them
    if (off + recLen > len) break;

    if (type === MSODRAWING || type === MSODRAWINGGROUP) {
      if (current) groups.push(current);
      current = recLen > 0 ? stream.subarray(off, off + recLen) : null;
    } else if (type === CONTINUE && current && recLen > 0) {
      const combined = new Uint8Array(current.length + recLen);
      combined.set(current, 0);
      combined.set(stream.subarray(off, off + recLen), current.length);
      current = combined;
    } else {
      if (current) { groups.push(current); current = null; }
    }

    off += recLen;
  }

  if (current) groups.push(current);
  return groups;
}

// Strip ALL BIFF record headers (4 bytes each: 2 type + 2 length) from a
// stream and concatenate just the record data. This is a more aggressive
// fallback that reconstructs contiguous data from every record type (not
// just MSODrawing), ensuring image bytes split across CONTINUE records of
// any record type are reassembled for magic-byte scanning.
export function stripAllBiffHeaders(stream) {
  const chunks = [];
  let off = 0;
  const len = stream.length;
  while (off + 4 <= len) {
    const recLen = stream[off + 2] | (stream[off + 3] << 8);
    off += 4;
    if (recLen === 0) continue;
    if (off + recLen > len) {
      chunks.push(stream.subarray(off));
      break;
    }
    chunks.push(stream.subarray(off, off + recLen));
    off += recLen;
  }
  let total = 0;
  for (const c of chunks) total += c.length;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { result.set(c, pos); pos += c.length; }
  return result;
}