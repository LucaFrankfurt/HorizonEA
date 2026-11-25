"use client";

import { Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/forms/delete-button";
import { EntityFormDialog, type Option } from "@/components/forms/entity-form";
import { assetFields } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/lib/db/schema";

interface Lists {
  platforms: Option[];
  locations: string[];
  owners: string[];
}

export function NewAssetButton({ platforms, locations, owners }: Lists) {
  return (
    <EntityFormDialog
      trigger={
        <Button>
          <Plus /> New asset
        </Button>
      }
      title="New IT asset"
      fields={assetFields(platforms, locations, owners)}
      endpoint="/api/assets"
      wide
    />
  );
}

export function AssetHeaderActions({ asset, platforms, locations, owners }: Lists & { asset: Asset }) {
  return (
    <>
      <EntityFormDialog
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
        title={`Edit ${asset.name}`}
        fields={assetFields(platforms, locations, owners)}
        endpoint="/api/assets"
        recordId={asset.id}
        initial={asset}
        wide
      />
      <DeleteButton
        url={`/api/assets/${asset.id}`}
        name={asset.name}
        redirectTo="/assets"
        consequence="Deployments of applications on this asset are removed as well."
      />
    </>
  );
}

export function AddHostedApplication({ assetId, applications }: { assetId: string; applications: Option[] }) {
  return (
    <EntityFormDialog
      trigger={
        <Button variant="ghost" size="sm">
          <Plus /> Add
        </Button>
      }
      title="Add hosted application"
      fields={[
        { name: "applicationId", label: "Application", type: "select", options: applications, required: true, full: true },
        { name: "role", label: "Role", placeholder: "e.g. Application server", full: true },
      ]}
      endpoint="/api/application-assets"
      extra={{ assetId }}
      submitLabel="Add deployment"
    />
  );
}
