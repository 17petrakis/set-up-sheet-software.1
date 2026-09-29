import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListOrdered, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ProcessStepCard from "./ProcessStepCard";

/**
 * Process steps: [{ title, description, media: [{ url, type, annotations }] }]
 * Steps are ordered — drag a step's handle to change the sequence.
 */
export default function ProcessSteps({ steps, onChange }) {
  const list = steps || [];

  const addStep = () => onChange([...list, { title: "", description: "", media: [] }]);
  const updateStep = (i, step) => onChange(list.map((s, idx) => (idx === i ? step : s)));
  const removeStep = (i) => onChange(list.filter((_, idx) => idx !== i));

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = [...list];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ListOrdered className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Process Steps</h2>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addStep}
            className="h-8 px-3 text-xs gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Step
          </Button>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
            No process steps yet — add steps in the order they run at the machine.
          </p>
        ) : (
          <>
            {list.length > 1 && (
              <p className="text-xs text-muted-foreground mb-2">Drag a step's handle to change the sequence.</p>
            )}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="process-steps">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                    {list.map((step, i) => (
                      <Draggable key={i} draggableId={`process-step-${i}`} index={i}>
                        {(dragProvided, snapshot) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                            <ProcessStepCard
                              step={step}
                              index={i}
                              onChange={(s) => updateStep(i, s)}
                              onRemove={() => removeStep(i)}
                              dragHandleProps={dragProvided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </CardContent>
    </Card>
  );
}