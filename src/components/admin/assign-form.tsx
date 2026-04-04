"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, CheckCircle, Clock, Globe, Trash2, Link as LinkIcon, Shield } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  isGroupLeader: boolean;
}

interface QuizLink {
  id: string;
  token: string;
  user: { name: string; email: string } | null;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  linkType: string;
}

interface AssignFormProps {
  quizId: string;
  users: User[];
  existingLinks: QuizLink[];
  existingPublicLinks: QuizLink[];
  existingInternalLinks: QuizLink[];
}

export function AssignForm({
  quizId,
  users,
  existingLinks,
  existingPublicLinks,
  existingInternalLinks,
}: AssignFormProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [publicExpiresAt, setPublicExpiresAt] = useState("");
  const [internalExpiresAt, setInternalExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicLoading, setPublicLoading] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<QuizLink[]>([]);
  const [publicLinks, setPublicLinks] = useState<QuizLink[]>(existingPublicLinks);
  const [internalLinks, setInternalLinks] = useState<QuizLink[]>(existingInternalLinks);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function copyLink(token: string) {
    const url = `${baseUrl}/quiz/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Link copied!");
  }

  async function handleGeneratePublicLink() {
    setPublicLoading(true);
    const res = await fetch(`/api/admin/quizzes/${quizId}/public-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt: publicExpiresAt || undefined }),
    });
    setPublicLoading(false);

    if (!res.ok) {
      toast.error("Failed to generate public link");
      return;
    }

    const link = await res.json();
    setPublicLinks((prev) => [{ ...link, linkType: "PUBLIC" }, ...prev]);
    setPublicExpiresAt("");
    toast.success("Public link generated!");
  }

  async function handleGenerateInternalLink() {
    setInternalLoading(true);
    const res = await fetch(`/api/admin/quizzes/${quizId}/internal-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt: internalExpiresAt || undefined }),
    });
    setInternalLoading(false);

    if (!res.ok) {
      toast.error("Failed to generate internal link");
      return;
    }

    const link = await res.json();
    setInternalLinks((prev) => [link, ...prev]);
    setInternalExpiresAt("");
    toast.success("Internal link generated!");
  }

  async function handleDeletePublicLink(linkId: string) {
    setDeletingId(linkId);
    const res = await fetch(`/api/admin/quizzes/${quizId}/public-link`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId }),
    });
    setDeletingId(null);

    if (!res.ok) {
      toast.error("Failed to delete link");
      return;
    }

    setPublicLinks((prev) => prev.filter((l) => l.id !== linkId));
    toast.success("Link deleted");
  }

  async function handleDeleteInternalLink(linkId: string) {
    setDeletingId(linkId);
    const res = await fetch(`/api/admin/quizzes/${quizId}/internal-link`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId }),
    });
    setDeletingId(null);

    if (!res.ok) {
      toast.error("Failed to delete link");
      return;
    }

    setInternalLinks((prev) => prev.filter((l) => l.id !== linkId));
    toast.success("Link deleted");
  }

  async function handleAssign() {
    if (selectedUserIds.length === 0) {
      toast.error("Select at least one user");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/admin/quizzes/${quizId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds: selectedUserIds,
        expiresAt: expiresAt || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Failed to generate links");
      return;
    }

    const links = await res.json();
    setGeneratedLinks(links);
    setSelectedUserIds([]);
    toast.success(`Generated ${links.length} quiz link(s)`);
  }

  const allPrivateLinks = [...generatedLinks, ...existingLinks].filter(
    (link, index, self) => self.findIndex((l) => l.id === link.id) === index
  );

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── PUBLIC LINK SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <h2 className="text-white font-semibold">Public Link</h2>
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
            Anyone with the link
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm">
          Share one link with everyone. Participants enter their name and email before starting.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-zinc-400 text-xs">Expiry (optional)</Label>
            <Input
              type="datetime-local"
              value={publicExpiresAt}
              onChange={(e) => setPublicExpiresAt(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <div className="sm:self-end">
            <Button
              onClick={handleGeneratePublicLink}
              disabled={publicLoading}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black w-full sm:w-auto"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {publicLoading ? "Generating..." : "Generate Public Link"}
            </Button>
          </div>
        </div>

        {publicLinks.length > 0 && (
          <div className="space-y-2">
            {publicLinks.map((link) => (
              <Card key={link.id} className="bg-zinc-900/50 border-amber-500/15">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
                          Public
                        </Badge>
                        {link.expiresAt && (
                          <span className="text-xs text-zinc-500">
                            Expires {format(new Date(link.expiresAt), "MMM d, yyyy HH:mm")}
                          </span>
                        )}
                      </div>
                      <code className="text-xs text-amber-400 break-all block">
                        {baseUrl}/quiz/{link.token}
                      </code>
                      <p className="text-xs text-zinc-500 mt-1">
                        Created {format(new Date(link.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(link.token)}
                        className="text-zinc-400 hover:text-white"
                      >
                        {copiedToken === link.token ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePublicLink(link.id)}
                        disabled={deletingId === link.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── INTERNAL LINK SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h2 className="text-white font-semibold">Internal Link</h2>
          <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs">
            Registered users only
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm">
          Share a link that only registered (logged-in) users can access. No per-user assignment needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-zinc-400 text-xs">Expiry (optional)</Label>
            <Input
              type="datetime-local"
              value={internalExpiresAt}
              onChange={(e) => setInternalExpiresAt(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <div className="sm:self-end">
            <Button
              onClick={handleGenerateInternalLink}
              disabled={internalLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              <Shield className="w-4 h-4 mr-2" />
              {internalLoading ? "Generating..." : "Generate Internal Link"}
            </Button>
          </div>
        </div>

        {internalLinks.length > 0 && (
          <div className="space-y-2">
            {internalLinks.map((link) => (
              <Card key={link.id} className="bg-zinc-900/50 border-blue-500/15">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs">
                          Internal
                        </Badge>
                        {link.expiresAt && (
                          <span className="text-xs text-zinc-500">
                            Expires {format(new Date(link.expiresAt), "MMM d, yyyy HH:mm")}
                          </span>
                        )}
                      </div>
                      <code className="text-xs text-blue-400 break-all block">
                        {baseUrl}/quiz/{link.token}
                      </code>
                      <p className="text-xs text-zinc-500 mt-1">
                        Created {format(new Date(link.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(link.token)}
                        className="text-zinc-400 hover:text-white"
                      >
                        {copiedToken === link.token ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInternalLink(link.id)}
                        disabled={deletingId === link.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── PRIVATE LINKS SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold">Private Links</h2>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
            One link per user
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm">
          Generate individual links for specific users — each link is tied to one person.
        </p>

        <div className="flex items-center justify-between">
          <Label className="text-zinc-300">Select Users</Label>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds(users.map((u) => u.id))}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds([])}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-zinc-800 rounded-lg p-3">
          {users.length === 0 ? (
            <p className="text-zinc-500 text-sm col-span-2 text-center py-4">
              No users available
            </p>
          ) : (
            users.map((user) => (
              <label
                key={user.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUserIds.includes(user.id)
                    ? "bg-amber-500/10 border border-amber-500/30"
                    : "hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="w-4 h-4 accent-amber-500"
                />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>
                {user.isGroupLeader && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs border-amber-600/50 text-amber-400 shrink-0"
                  >
                    Leader
                  </Badge>
                )}
              </label>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-zinc-400 text-xs">Expiry (optional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <div className="sm:self-end">
            <Button
              onClick={handleAssign}
              disabled={loading || selectedUserIds.length === 0}
              className="bg-zinc-800 hover:bg-zinc-700 text-white w-full sm:w-auto"
            >
              {loading
                ? "Generating..."
                : `Generate ${selectedUserIds.length > 0 ? selectedUserIds.length : ""} Link(s)`}
            </Button>
          </div>
        </div>

        {allPrivateLinks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-white font-medium text-sm">
              Private Links ({allPrivateLinks.length})
            </h3>
            {allPrivateLinks.map((link) => (
              <Card key={link.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-white text-sm font-medium">
                          {link.user?.name || "—"}
                        </p>
                        <p className="text-zinc-400 text-xs">{link.user?.email}</p>
                        <Badge
                          variant="outline"
                          className={
                            link.used
                              ? "border-green-600/50 text-green-400 text-xs"
                              : "border-zinc-700 text-zinc-400 text-xs"
                          }
                        >
                          {link.used ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Used</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" />Unused</>
                          )}
                        </Badge>
                      </div>
                      <code className="text-xs text-amber-400 break-all">
                        {baseUrl}/quiz/{link.token}
                      </code>
                      <p className="text-xs text-zinc-500 mt-1">
                        Created {format(new Date(link.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(link.token)}
                      className="text-zinc-400 hover:text-white shrink-0"
                    >
                      {copiedToken === link.token ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
