'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { hhmmToInput, toHhmm } from '@/lib/dates';
import { CHRONIC_ITEMS, CHRONIC_OTHER_MAP_ID, FieldDef, GroupDef, TREATMENT_LINES, labelOf } from '@/lib/section-config';

type Values = Record<string, any>;

function Choice({ name, options, value, onChange, disabled }: { name: string; options: string[]; value?: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-5 pt-1">
      <RadioGroup name={name} value={value ?? ''} onValueChange={onChange} disabled={disabled} className="flex flex-wrap gap-5">
        {options.map((o) => (
          <div key={o} className="flex items-center gap-2">
            <RadioGroupItem value={o} id={`${name}-${o}`} />
            <Label htmlFor={`${name}-${o}`} className="font-normal text-slate-700">{o}</Label>
          </div>
        ))}
      </RadioGroup>
      {value && !disabled && (
        <button type="button" onClick={() => onChange('')} className="text-xs text-slate-500 hover:text-slate-600 underline">
          clear
        </button>
      )}
    </div>
  );
}

const CHARGE_KEYS = ['costRoomRentNursing', 'costInvestigationDiagnostics', 'costIcuCharges', 'costOtCharges', 'costProfessionalFees', 'costMedicinesConsumables', 'costOtherHospitalExpenses'];
const rupees = (v: unknown) => Number(String(v ?? '').replace(/[,\s₹]|Rs\.?/gi, '')) || 0;

/** Itemised charges a to l plus other expenses; an all-inclusive package stands in when nothing is itemised. */
function sumOfCharges(values: Values): number {
  const itemised = CHARGE_KEYS.reduce((t, k) => t + rupees(values[k]), 0);
  return itemised > 0 ? itemised : rupees(values.costAllInclusivePackage);
}

const slashed = (d: string) => [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/');

/**
 * Day/month/year text box (the browser's own date picker follows the machine's language and shows month first).
 * The form stores DDMMYYYY, or DDMMYY for the 6-cell admission date; a half-typed value is kept as typed so
 * saving flags it instead of silently dropping it.
 */
function DateText({ id, value, short, disabled, onChange }: { id: string; value?: string; short?: boolean; disabled?: boolean; onChange: (v: string) => void }) {
  const toText = (stored?: string) => {
    const d = String(stored ?? '').replace(/\D/g, '');
    return slashed(short && d.length === 6 ? d.slice(0, 4) + '20' + d.slice(4) : d);
  };
  const [text, setText] = useState(toText(value));
  const sent = useRef(value ?? '');
  useEffect(() => {
    if ((value ?? '') !== sent.current) { sent.current = value ?? ''; setText(toText(value)); }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const typed = text.replace(/\D/g, '');
  const incomplete = typed.length > 0 && typed.length < 8;
  return (
    <>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        maxLength={10}
        disabled={disabled}
        aria-invalid={incomplete || undefined}
        value={text}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, '').slice(0, 8);
          const stored = short && d.length === 8 ? d.slice(0, 4) + d.slice(6) : d;
          setText(slashed(d));
          sent.current = stored;
          onChange(stored);
        }}
      />
      {incomplete && <p className="mt-1 text-xs text-amber-700">Enter the full date as dd/mm/yyyy.</p>}
    </>
  );
}

function Field({ def, values, set, disabled, errorFields, optionOverrides }: { def: FieldDef; values: Values; set: (k: string, v: any) => void; disabled?: boolean; errorFields?: string[]; optionOverrides?: Record<string, string[]> }) {
  const v = values[def.key];
  const id = `f-${def.key}`;
  const bad = errorFields?.includes(def.key);
  let control: React.ReactNode;

  switch (def.kind) {
    case 'textarea':
      control = <Textarea id={id} rows={3} disabled={disabled} value={v ?? ''} onChange={(e) => set(def.key, e.target.value)} />;
      break;
    case 'date8':
      control = <DateText id={id} value={v} disabled={disabled} onChange={(x) => set(def.key, x)} />;
      break;
    case 'date6':
      control = <DateText id={id} value={v} short disabled={disabled} onChange={(x) => set(def.key, x)} />;
      break;
    case 'time':
      control = <Input id={id} type="time" disabled={disabled} value={hhmmToInput(v)} onChange={(e) => set(def.key, e.target.value ? toHhmm(e.target.value) : '')} />;
      break;
    case 'yesno':
      control = <Choice name={id} options={['Yes', 'No']} value={v} disabled={disabled} onChange={(x) => set(def.key, x)} />;
      break;
    case 'gender':
      control = <Choice name={id} options={['Male', 'Female']} value={v} disabled={disabled} onChange={(x) => set(def.key, x)} />;
      break;
    case 'choice':
      control = <Choice name={id} options={optionOverrides?.[def.key] ?? def.options ?? []} value={v} disabled={disabled} onChange={(x) => set(def.key, x)} />;
      break;
    case 'treatment':
      control = (
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
          {TREATMENT_LINES.map((t) => {
            const list: string[] = v || [];
            return (
              <div key={t} className="flex items-center gap-2">
                <Checkbox id={`${id}-${t}`} disabled={disabled} checked={list.includes(t)} onCheckedChange={(c) => set(def.key, c === true ? [...list, t] : list.filter((x) => x !== t))} />
                <Label htmlFor={`${id}-${t}`} className="font-normal text-slate-700">{t}</Label>
              </div>
            );
          })}
        </div>
      );
      break;
    default:
      control = (
        <Input
          id={id}
          type={def.kind === 'email' ? 'email' : def.kind === 'tel' ? 'tel' : 'text'}
          inputMode={def.kind === 'digits' || def.kind === 'amount' ? 'numeric' : undefined}
          disabled={disabled}
          value={v ?? ''}
          onChange={(e) => set(def.key, e.target.value)}
        />
      );
  }

  return (
    <div className={`space-y-1.5 ${def.wide ? 'sm:col-span-2' : ''}`}>
      <Label htmlFor={id} className={bad ? 'text-rose-600' : undefined}>
        {labelOf(def.mapId)}
      </Label>
      <div className={bad ? 'rounded-xl ring-2 ring-rose-400' : undefined}>{control}</div>
      {def.key === 'costSumTotalExpected' && !disabled && (
        <button
          type="button"
          onClick={() => set(def.key, String(sumOfCharges(values)))}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Fill with the total of the charges above
        </button>
      )}
      {bad && <p role="alert" className="text-xs font-semibold text-rose-600">Please check this value.</p>}
    </div>
  );
}

export function SectionEditor({ groups, values, onChange, disabled, errorFields, optionOverrides }: { groups: GroupDef[]; values: Values; onChange: (next: Values) => void; disabled?: boolean; errorFields?: string[]; optionOverrides?: Record<string, string[]> }) {
  const set = (k: string, v: any) => onChange({ ...values, [k]: v });
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <Card key={g.id} className="rounded-2xl border-slate-200/80 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">{g.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {g.fields.filter((d) => !d.showIf || d.showIf(values)).map((d) => (
                <Field key={d.key} def={d} values={values} set={set} disabled={disabled} errorFields={errorFields} optionOverrides={optionOverrides} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A bare list of fields (used for the page-2 doctor block). */
export function FieldList({ fields, values, onChange, disabled, errorFields }: { fields: FieldDef[]; values: Values; onChange: (next: Values) => void; disabled?: boolean; errorFields?: string[] }) {
  const set = (k: string, v: any) => onChange({ ...values, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((d) => <Field key={d.key} def={d} values={values} set={set} disabled={disabled} errorFields={errorFields} />)}
    </div>
  );
}

const mmyyToMonth = (v?: string) => (v && /^\d{4}$/.test(v) ? `20${v.slice(2)}-${v.slice(0, 2)}` : '');
const monthToMmyy = (m: string) => (m ? m.slice(5, 7) + m.slice(2, 4) : '');

export function ChronicEditor({ values, onChange, disabled }: { values: Values; onChange: (next: Values) => void; disabled?: boolean }) {
  const setItem = (key: string, patch: Values) => onChange({ ...values, [key]: { ...(values[key] || {}), ...patch } });
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Past history of chronic illness (if yes, since month / year)</h2>
        <div className="space-y-2">
          {CHRONIC_ITEMS.map((it) => (
            <div key={it.key} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 min-w-[240px]">
                <Checkbox id={`chronic-${it.key}`} disabled={disabled} checked={!!values[it.key]?.present} onCheckedChange={(c) => setItem(it.key, { present: c === true })} />
                <Label htmlFor={`chronic-${it.key}`} className="font-normal text-slate-700">{labelOf(it.mapId)}</Label>
              </div>
              {values[it.key]?.present && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  since
                  <Input type="month" disabled={disabled} value={mmyyToMonth(values[it.key]?.sinceMmyy)} onChange={(e) => setItem(it.key, { sinceMmyy: monthToMmyy(e.target.value) })} className="h-8 w-40 rounded-lg" />
                </div>
              )}
            </div>
          ))}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="chronic-other">{labelOf(CHRONIC_OTHER_MAP_ID)}</Label>
            <Input id="chronic-other" disabled={disabled} value={values.otherAilmentDetails ?? ''} onChange={(e) => onChange({ ...values, otherAilmentDetails: e.target.value })} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
