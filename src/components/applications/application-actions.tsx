"use client";

import { Link2, Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/forms/delete-button";
import { EntityFormDialog, type Option } from "@/components/forms/entity-form";
import { appAssetFields, applicationFields, appTechFields, interfaceFields } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { Application, Interface } from "@/lib/db/schema";

export function ApplicationHeaderActions({ app, domains }: { app: Application; domains: string[] }) {
  return (
    <>
      <EntityFormDialog
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
        title={`Edit ${app.name}`}
        fields={applicationFields(domains)}
        endpoint="/api/applications"
        recordId={app.id}
        initial={app}
        wide
      />
      <DeleteButton
        url={`/api/applications/${app.id}`}
        name={app.name}
        redirectTo="/applications"
        consequence="All interfaces, technology links, deployments and migration items referencing this application are removed as well."
      />
    </>
  );
}

export function AddTechnologyLink({ applicationId, technologies }: { applicationId: string; technologies: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Plus /> Add
        </Button>
      }
      title="Add technology"
      description="Record a technology / version this application uses."
      fields={appTechFields(technologies)}
      endpoint="/api/application-technologies"
      extra={{ applicationId }}
      submitLabel="Add technology"
    />
  );
}

export function AddAssetLink({ applicationId, assets }: { applicationId: string; assets: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Plus /> Add
        </Button>
      }
      title="Add deployment"
      description="Record an IT asset this application is deployed on or hosted by."
      fields={appAssetFields(assets)}
      endpoint="/api/application-assets"
      extra={{ applicationId }}
      submitLabel="Add deployment"
    />
  );
}

export function AddInterface({ applicationId, applications }: { applicationId: string; applications: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Link2 /> Add interface
        </Button>
      }
      title="New interface"
      description="Describe a data flow between two applications."
      fields={interfaceFields(applications)}
      endpoint="/api/interfaces"
      initial={{ sourceApplicationId: applicationId, architectureState: "Both" }}
      wide
    />
  );
}

export function EditInterface({ iface, applications }: { iface: Interface; applications: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title={`Edit ${iface.name}`} aria-label={`Edit ${iface.name}`}>
          <Pencil className="text-muted-foreground" />
        </Button>
      }
      title={`Edit interface`}
      fields={interfaceFields(applications)}
      endpoint="/api/interfaces"
      recordId={iface.id}
      initial={iface}
      wide
    />
  );
}
