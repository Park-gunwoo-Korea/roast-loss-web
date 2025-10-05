import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";

/* ----------------- Helpers ----------------- */
const toNumber = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat((v || "").toString().replace(",", "."));
  return isNaN(n) ? 0 : n;
};
const clamp2 = (n: number) => Math.round(n * 100) / 100;

type Row = { id: number; drop: string; agtron?: string; devSec?: string; notes?: string };
type Levels = { lightLo: number; lightHi: number; medHi: number; mDarkHi: number };
const defaultLevels: Levels = { lightLo: 11, lightHi: 13, medHi: 15, mDarkHi: 17 };

function roastLevel(lossPct: number, lv: Levels) {
  if (lossPct <= 0) return "(계산 대기)";
  if (lossPct < lv.lightLo) return "라이트(아주 밝음)";
  if (lossPct < lv.lightHi) return "라이트";
  if (lossPct < lv.medHi) return "미디움";
  if (lossPct < lv.mDarkHi) return "미디움 다크";
  return "다크";
}

function suggestChargeForTargetRemain(targetRemain: number, lossPct: number) {
  const r = 1 - lossPct / 100;
  if (r <= 0) return 0;
  return targetRemain / r;
}

type ComputedItem = Row & { drop: number; loss: number; lossPct: number; level: string };

/* ----------------- CSV Export ----------------- */
function rowsToCSV(rows: ComputedItem[], charge: number) {
  const header = [
    "배치",
    "투입(g)",
    "생산(g)",
    "손실(g)",
    "손실률(%)",
    "아그트론",
    "DT(%)",
    "로스팅포인트",
    "노트 및 설명",
  ].join(",");

  const lines = rows.map((r, i) =>
    [
      i + 1,
      charge,
      r.drop,
      clamp2(r.loss),
      clamp2(r.lossPct),
      r.agtron || "",
      r.devSec || "",
      r.level,
      (r.notes || "").replace(/\n/g, " "),
    ].join(",")
  );

  return [header, ...lines].join("\n");
}

function downloadCSV(filename: string, content: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ----------------- Main App ----------------- */
export default function App() {
  const [charge, setCharge] = useState<string>(() => localStorage.getItem("rlc_charge") || "130");
  const [rows, setRows] = useState<Row[]>(() => {
    const saved = localStorage.getItem("rlc_rows");
    return saved ? JSON.parse(saved) : [{ id: 1, drop: "" }];
  });
  const [cuppingPerSession, setCuppingPerSession] = useState<string>(() => localStorage.getItem("rlc_cup_per") || "15");
  const [cuppingSessions, setCuppingSessions] = useState<string>(() => localStorage.getItem("rlc_cup_num") || "1");
  const [targetRemain, setTargetRemain] = useState<string>(() => localStorage.getItem("rlc_target") || "100");
  const [levels, setLevels] = useState<Levels>(() => {
    const saved = localStorage.getItem("rlc_levels");
    return saved ? JSON.parse(saved) : defaultLevels;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [perBatchCupping, setPerBatchCupping] = useState(false);

  // persist
  useEffect(() => localStorage.setItem("rlc_charge", charge), [charge]);
  useEffect(() => localStorage.setItem("rlc_rows", JSON.stringify(rows)), [rows]);
  useEffect(() => localStorage.setItem("rlc_cup_per", cuppingPerSession), [cuppingPerSession]);
  useEffect(() => localStorage.setItem("rlc_cup_num", cuppingSessions), [cuppingSessions]);
  useEffect(() => localStorage.setItem("rlc_target", targetRemain), [targetRemain]);
  useEffect(() => localStorage.setItem("rlc_levels", JSON.stringify(levels)), [levels]);

  const chargeNum = toNumber(charge);

  const computed = useMemo(() => {
    const items: ComputedItem[] = rows.map((r) => {
      const drop = toNumber(r.drop);
      const loss = clamp2(chargeNum - drop);
      const lossPct = chargeNum > 0 ? clamp2(((chargeNum - drop) / chargeNum) * 100) : 0;
      const level = roastLevel(lossPct, levels);
      return { ...r, drop, loss, lossPct, level };
    });
    const totalDrop = clamp2(items.reduce((s, x) => s + (x.drop || 0), 0));
    const avgDrop = items.length ? clamp2(totalDrop / items.length) : 0;
    const avgLossPct = items.length ? clamp2(items.reduce((s, x) => s + (x.lossPct || 0), 0) / items.length) : 0;
    const totalCupping = perBatchCupping
      ? toNumber(cuppingPerSession) * items.filter(x => x.drop > 0).length
      : toNumber(cuppingPerSession) * toNumber(cuppingSessions);
    const remainAfterCupping = clamp2(totalDrop - totalCupping);
    const targetRemainNum = toNumber(targetRemain);
    const suggestedChargeForAvgLoss = avgLossPct > 0 ? clamp2(suggestChargeForTargetRemain(targetRemainNum, avgLossPct)) : 0;
    return { items, totalDrop, avgDrop, avgLossPct, totalCupping, remainAfterCupping, suggestedChargeForAvgLoss };
  }, [rows, chargeNum, cuppingPerSession, cuppingSessions, targetRemain, levels, perBatchCupping]);

  const addRow = () => {
    const nextId = (rows.length ? rows[rows.length - 1].id : 0) + 1;
    setRows([...rows, { id: nextId, drop: "" }]);
  };
  const removeRow = (id: number) => setRows(rows.filter((r) => r.id !== id));
  const resetRows = () => setRows([{ id: 1, drop: "" }]);

  const onExportCSV = () =>
    downloadCSV(`roast_loss_${new Date().toISOString().slice(0, 10)}.csv`, rowsToCSV(computed.items, chargeNum));

  const onImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      const data = lines.slice(1).map((ln, i) => {
        const [, , drop_g, , , agtron, dev_sec, , notes] = ln.split(",");
        return { id: i + 1, drop: drop_g || "", agtron: agtron || "", devSec: dev_sec || "", notes: notes || "" } as Row;
      });
      if (data.length) setRows(data);
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative min-h-screen bg-[#F4EFE8] text-[#4B2E2B] font-[Pretendard] px-6 md:px-12 py-6 md:py-8 max-w-6xl mx-auto space-y-8">
      {/* 🔸 워터마크: 아주 옅은 중앙 배경 */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage: "url('/ur-logo.jpeg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "min(90vw, 900px)",
        }}
      />

      {/* 🔸 제목 중앙 정렬 */}
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
        Roasting 유기물손실률 계산
      </h1>

      {/* 🔸 입력 영역 */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px] max-w-[220px]">
              <Label>투입량(Charge, g)</Label>
              <Input value={charge} onChange={(e) => setCharge(e.target.value)} placeholder="예: 130" />
            </div>
            <div className="flex-1 min-w-[140px] max-w-[220px]">
              <Label>커핑 1회 사용량(g)</Label>
              <Input value={cuppingPerSession} onChange={(e) => setCuppingPerSession(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[140px] max-w-[220px]">
              <Label>커핑 횟수(세션 수)</Label>
              <Input value={cuppingSessions} onChange={(e) => setCuppingSessions(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[140px] max-w-[220px]">
              <Label>목표 남길 양(g)</Label>
              <Input value={targetRemain} onChange={(e) => setTargetRemain(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="perBatch" checked={perBatchCupping} onCheckedChange={(v: boolean) => setPerBatchCupping(v)} />
              <Label htmlFor="perBatch">배치별 커핑 차감</Label>
            </div>
            <Button variant="outline" onClick={() => setShowSettings((s) => !s)}>
              설정
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🔸 Settings */}
      {showSettings && (
        <Card>
          <CardContent className="p-4 md:p-6 grid md:grid-cols-5 gap-4">
            <div className="md:col-span-5 text-sm font-medium">배전도 경계값 커스텀(손실률 %)</div>
            <div><Label>라이트 하한</Label><Input value={levels.lightLo} onChange={(e)=>setLevels({...levels, lightLo: toNumber(e.target.value)})} /></div>
            <div><Label>라이트 상한</Label><Input value={levels.lightHi} onChange={(e)=>setLevels({...levels, lightHi: toNumber(e.target.value)})} /></div>
            <div><Label>미디움 상한</Label><Input value={levels.medHi} onChange={(e)=>setLevels({...levels, medHi: toNumber(e.target.value)})} /></div>
            <div><Label>미디움다크 상한</Label><Input value={levels.mDarkHi} onChange={(e)=>setLevels({...levels, mDarkHi: toNumber(e.target.value)})} /></div>
            <div className="flex items-end"><Button variant="secondary" onClick={()=>setLevels(defaultLevels)}>기본값 복원</Button></div>
          </CardContent>
        </Card>
      )}

      {/* 🔸 Table */}
      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-base font-medium">배치 입력</div>
            <div className="flex gap-2">
              <Button onClick={addRow} variant="secondary">행 추가</Button>
              <Button variant="outline" onClick={() => document.getElementById("csvInput")?.click()}>CSV 불러오기</Button>
              <input id="csvInput" type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportCSV(f); }} />
              <Button onClick={onExportCSV} variant="outline">CSV 내보내기</Button>
              <Button onClick={resetRows} variant="ghost">초기화</Button>
            </div>
          </div>

          {/* 🔸 Header */}
          <div className="grid grid-cols-12 gap-2 text-xs md:text-sm font-medium text-[#4B2E2B]/60 px-2">
            <div className="col-span-1">#</div>
            <div className="col-span-2">배출량(g)</div>
            <div className="col-span-2">손실량(g)</div>
            <div className="col-span-2">손실률(%)</div>
            <div className="col-span-2">배전도</div>
            <div className="col-span-1">Agtron</div>
            <div className="col-span-1">DT(%)</div>
            <div className="col-span-1 text-right">삭제</div>
          </div>

          {/* 🔸 Rows */}
          {computed.items.map((r, idx) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-start bg-white rounded-2xl p-2 border border-[#4B2E2B]/15">
              <div className="col-span-1 text-sm">{idx + 1}</div>
              <div className="col-span-2"><Input value={rows[idx].drop} onChange={(e)=>{const next=[...rows];next[idx]={...next[idx],drop:e.target.value};setRows(next);}} placeholder="예: 114.5" className="w-full max-w-[110px]" /></div>
              <div className="col-span-2 text-sm">{r.drop ? clamp2(r.loss) : "-"}</div>
              <div className="col-span-2 text-sm">{r.drop ? clamp2(r.lossPct).toFixed(2) : "-"}</div>
              <div className="col-span-2 text-sm">{r.drop ? roastLevel(r.lossPct, levels) : "-"}</div>
              <div className="col-span-1"><Input value={rows[idx].agtron || ""} onChange={(e)=>{const next=[...rows];next[idx]={...next[idx],agtron:e.target.value};setRows(next);}} placeholder="예: 75" className="max-w-[90px]" /></div>
              <div className="col-span-1"><Input value={rows[idx].devSec || ""} onChange={(e)=>{const next=[...rows];next[idx]={...next[idx],devSec:e.target.value};setRows(next);}} placeholder="예: 18" className="max-w-[90px]" /></div>
              <div className="col-span-1 text-right"><Button size="icon" variant="ghost" onClick={()=>removeRow(r.id)}>🗑</Button></div>
              <div className="col-span-12"><Textarea value={rows[idx].notes || ""} onChange={(e)=>{const next=[...rows];next[idx]={...next[idx],notes:e.target.value};setRows(next);}} placeholder="향미/이슈/조정 메모" /></div>
            </div>
          ))}

          {/* 🔸 Summary */}
          <div className="grid grid-cols-12 gap-2 items-center border-t border-[#4B2E2B]/15 pt-3 mt-3 text-sm">
            <div className="col-span-3 font-medium">합계/평균</div>
            <div className="col-span-3 text-[#4B2E2B]/80">총 배출량: {computed.totalDrop} g</div>
            <div className="col-span-3 text-[#4B2E2B]/80">평균 손실률: {computed.avgLossPct.toFixed(2)}%</div>
            <div className="col-span-3 text-[#4B2E2B]/80 text-right">평균 배출량: {computed.avgDrop} g</div>
            <div className="col-span-12 text-right text-[#4B2E2B]/80">
              커핑 차감 후 잔량: {computed.remainAfterCupping} g (총 커핑{" "}
              {perBatchCupping
                ? toNumber(cuppingPerSession) * computed.items.filter((x) => x.drop > 0).length
                : toNumber(cuppingPerSession) * toNumber(cuppingSessions)}{" "}
              g)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔸 하단 공식 */}
      <div className="text-sm text-[#4B2E2B]/70 italic mt-6">
        💡 유기물 손실률(%) = 100% - [ (100 - 로스팅 손실률) × 원두의 건조 무게 / 생두의 건조 무게 ] %
      </div>
    </div>
  );
}