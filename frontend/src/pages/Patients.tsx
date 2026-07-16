import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import type { Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { listPatients, deletePatient } from "../api/patients";
import { getPatientBalances } from "../api/invoices";
import { formatCurrency } from "../lib/format";
import PatientForm from "../components/PatientForm";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../app/components/ui/table";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Badge } from "../app/components/ui/badge";
import { Skeleton } from "../app/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "../app/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "../app/components/ui/alert-dialog";

const PAGE_SIZE = 10;

export default function Patients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canCreate, canEdit, canDelete } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [remainingMap, setRemainingMap] = useState<Record<string, number>>({});
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPatients({ search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setPatients(res.data);
      setCount(res.count);

      // Fetch balances scoped to exactly the 10 IDs on this page — no payments join, minimal payload
      const ids = res.data.map((p) => p.id);
      if (ids.length > 0) {
        getPatientBalances(ids)
          .then(({ data }) => setRemainingMap(data))
          .catch(() => {});
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowForm(true);
      setSearchParams({});
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleDelete = async (p: Patient) => {
    try {
      await deletePatient(p.id);
      toast.success("Patient deleted");
      setDeleteConfirm(null);
      fetchPatients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete patient");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("patients.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("patients.totalPatients", { count })}</p>
        </div>
        {canCreate() && (
          <Button
            onClick={() => {
              setEditPatient(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4" /> {t("patients.addPatient")}
          </Button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className={`absolute ${isAr ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
        <Input
          placeholder={t("patients.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={isAr ? "pr-9" : "pl-9"}
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("patients.columns.patient")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("patients.columns.phone")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("patients.columns.dateOfBirth")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("patients.columns.gender")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("patients.columns.bloodType")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("patients.columns.remaining")}</TableHead>
              <TableHead className="text-end">{t("patients.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AnimatePresence initial={false}>
                {patients.map((p) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="hover:bg-muted/50 border-b transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {p.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">{p.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{p.phone}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {p.date_of_birth ? formatDate(p.date_of_birth, isAr) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="capitalize text-muted-foreground">
                        {p.gender ? t(`patients.form.${p.gender}`) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {p.blood_type ? <Badge variant="secondary">{p.blood_type}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {remainingMap[p.id] != null ? (
                        remainingMap[p.id] > 0 ? (
                          <span className="text-amber-600 font-semibold">{formatCurrency(remainingMap[p.id])}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">{t("common.invoiceStatus.paid")}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/patients/${p.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("common.edit")}
                            onClick={() => {
                              setEditPatient(p);
                              setShowForm(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("common.delete")}
                            className="hover:text-destructive"
                            onClick={() => setDeleteConfirm(p)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
            {!loading && patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {t("patients.noPatients")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count)} of {count}
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page > 1) setPage((p) => p - 1); }}
                    className={page === 1 ? "pointer-events-none opacity-40" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-xs font-medium text-foreground px-2">{page} / {totalPages}</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage((p) => p + 1); }}
                    className={page === totalPages ? "pointer-events-none opacity-40" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {showForm && (
        <PatientForm
          patient={editPatient}
          open={showForm}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
          onSaved={() => { setShowForm(false); setEditPatient(null); fetchPatients(); }}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("patients.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("patients.delete.description", { name: deleteConfirm?.full_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatDate(d: string, isAr: boolean) {
  return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
