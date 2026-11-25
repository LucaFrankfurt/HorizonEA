"use client";

import { Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/forms/delete-button";
import { EntityFormDialog } from "@/components/forms/entity-form";
import { technologyFields } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { Technology } from "@/lib/db/schema";

export function NewTechnologyButton({ vendors }: { vendors: string[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button>
          <Plus /> New technology
        </Button>
      }
      title="New technology"
      fields={technologyFields(vendors)}
      endpoint="/api/technologies"
      wide
    />
  );
}

export function TechnologyHeaderActions({ tech, vendors }: { tech: Technology; vendors: string[] }) {
  return (
    <>
      <EntityFormDialog
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
        title={`Edit ${tech.name} ${tech.version}`}
        fields={technologyFields(vendors)}
        endpoint="/api/technologies"
        recordId={tech.id}
        initial={tech}
        wide
      />
      <DeleteButton
        url={`/api/technologies/${tech.id}`}
        name={`${tech.name} ${tech.version}`}
        redirectTo="/technologies"
        consequence="Application links and migration items referencing this technology are removed; assets using it as platform keep running without a platform reference."
      />
    </>
  );
}
