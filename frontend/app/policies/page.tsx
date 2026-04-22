"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PolicyTable } from "@/components/policies/policy-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPolicies, updatePolicies } from "@/lib/api";
import type { PolicyRule, PolicyVersion } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function PoliciesPage() {
  const [policy, setPolicy] = useState<PolicyVersion | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [createdBy, setCreatedBy] = useState("policy-admin");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const activePolicy = await getPolicies();
      setPolicy(activePolicy);
      setName(activePolicy.name);
      setDescription(activePolicy.description);
      setRules(activePolicy.rules);
    }

    void load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updatePolicies({
        name,
        description,
        rules,
        created_by: createdBy,
      });
      setPolicy(updated);
      setName(updated.name);
      setDescription(updated.description);
      setRules(updated.rules);
      setMessage(`Saved as new active policy version ${updated.version}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <Card className="panel-gradient border-primary/20">
        <CardContent className="space-y-4">
          <Badge variant="outline">Policy management</Badge>
          <h2 className="text-3xl font-semibold">Governance rule administration</h2>
          <p className="text-muted-foreground">
            Adjust active thresholds, enable or disable rules, and save the changes as a new policy version for demo use.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active policy metadata</CardTitle>
            <CardDescription>Policy version context and editable governance notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="mt-2 text-xl font-semibold">{policy?.version ?? "Loading..."}</p>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="mt-2 text-xl font-semibold">{policy ? formatDate(policy.updated_at) : "Loading..."}</p>
              </div>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Policy name" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Policy description" />
            <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="Policy editor name" />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save new policy version"}
            </Button>
            {message ? <p className="text-sm text-success">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active governance rules</CardTitle>
            <CardDescription>Threshold editing is persisted to the backend as a new active version.</CardDescription>
          </CardHeader>
          <CardContent>
            <PolicyTable rules={rules} onChange={setRules} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
