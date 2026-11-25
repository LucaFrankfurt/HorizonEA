"use client";

import { Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/forms/delete-button";
import { EntityFormDialog, type Option } from "@/components/forms/entity-form";
import { initiativeFields, itemFields, phaseFields } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { Initiative, InitiativeItem, InitiativePhase } from "@/lib/db/schema";

export function NewInitiativeButton({ status }: { status?: string }) {
  return (
    <EntityFormDialog
      trigger={
        <Button>
          <Plus /> New initiative
        </Button>
      }
      title="New initiative"
      fields={initiativeFields()}
      endpoint="/api/initiatives"
      initial={{ status: status ?? "Backlog", strategy: "Replace", riskLevel: "Medium" }}
      wide
    />
  );
}

export function InitiativeHeaderActions({ initiative }: { initiative: Initiative }) {
  return (
    <>
      <EntityFormDialog
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
        title={`Edit ${initiative.name}`}
        fields={initiativeFields()}
        endpoint="/api/initiatives"
        recordId={initiative.id}
        initial={initiative}
        wide
      />
      <DeleteButton
        url={`/api/initiatives/${initiative.id}`}
        name={initiative.name}
        redirectTo="/transformations"
        consequence="Its As-Is → To-Be mappings and phases are deleted as well. Applications and technologies are not affected."
      />
    </>
  );
}

export function AddItemButton({ initiativeId, applications, technologies }: { initiativeId: string; applications: Option[]; technologies: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Plus /> Add mapping
        </Button>
      }
      title="Add As-Is → To-Be mapping"
      description="Link a current application or technology to its target. Leave the target empty for a retirement, the source empty for a new build."
      fields={itemFields(applications, technologies)}
      endpoint="/api/initiative-items"
      extra={{ initiativeId }}
      initial={{ kind: "Application" }}
      submitLabel="Add mapping"
      wide
    />
  );
}

export function EditItemButton({ item, applications, technologies }: { item: InitiativeItem; applications: Option[]; technologies: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label="Edit mapping" title="Edit mapping">
          <Pencil className="text-muted-foreground" />
        </Button>
      }
      title="Edit mapping"
      fields={itemFields(applications, technologies)}
      endpoint="/api/initiative-items"
      recordId={item.id}
      initial={item}
      wide
    />
  );
}

export function AddPhaseButton({ initiativeId, nextOrder }: { initiativeId: string; nextOrder: number }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Plus /> Add phase
        </Button>
      }
      title="Add phase / milestone"
      fields={phaseFields()}
      endpoint="/api/initiative-phases"
      extra={{ initiativeId }}
      initial={{ status: "Planned", sortOrder: nextOrder }}
      submitLabel="Add phase"
    />
  );
}

export function EditPhaseButton({ phase }: { phase: InitiativePhase }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${phase.name}`} title={`Edit ${phase.name}`}>
          <Pencil className="text-muted-foreground" />
        </Button>
      }
      title={`Edit ${phase.name}`}
      fields={phaseFields()}
      endpoint="/api/initiative-phases"
      recordId={phase.id}
      initial={phase}
    />
  );
}
