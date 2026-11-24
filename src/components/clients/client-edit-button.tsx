"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { ClientDialog, type ClientValues } from "@/components/clients/client-dialog";
import { Button } from "@/components/ui/button";

export function ClientEditButton({ client }: { client: ClientValues & { id: string } }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil /> Edit
      </Button>
      <ClientDialog open={open} onOpenChange={setOpen} client={client} />
    </>
  );
}
