import React, { useMemo, useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Truck,
  TrendingUp,
  Landmark,
  Gauge,
  PartyPopper,
  Wrench,
} from "lucide-react";

// ---------- helpers ----------------------------------------------------
const eok = (won) => won / 1e8;
const manwon = (won) => won / 1e4;
const fmtEok = (won, d = 2) => (isFinite(won) ? eok(won).toFixed(d) + "억원" : "—");
const fmtManwon = (won, d = 0) => (isFinite(won) ? manwon(won).toFixed(d) + "만원" : "—");
const fmtUsd = (usd) => (isFinite(usd) ? "$" + Math.round(usd).toLocaleString("en-US") : "—");
const fmtPct = (p, d = 2) => (isFinite(p) ? p.toFixed(d) + "%" : "—");

const COLORS = {
  fx: { ring: "#38BDF8", bg: "#EAF7FF", text: "#0369A1", chip: "#38BDF8" },
  price: { ring: "#FB923C", bg: "#FFF3E8", text: "#C2410C", chip: "#FB923C" },
  rent: { ring: "#F472B6", bg: "#FFEDF7", text: "#BE185D", chip: "#F472B6" },
  yieldc: { ring: "#FB7185", bg: "#FFEDF1", text: "#BE123C", chip: "#FB7185" },
  rate: { ring: "#A78BFA", bg: "#F3EEFF", text: "#6D28D9", chip: "#A78BFA" },
  dep: { ring: "#34D399", bg: "#EAFBF3", text: "#047857", chip: "#34D399" },
  op: { ring: "#22D3EE", bg: "#E7FBFE", text: "#0E7490", chip: "#22D3EE" },
  cost: { ring: "#F87171", bg: "#FEF2F2", text: "#B91C1C", chip: "#F87171" },
};

const DEFAULTS = {
  mode: "price", // 'price' = 장비가격 고정→임대료 산정 · 'rent' = 임대료 고정→장비가격 산정
  fx: 1500,
  priceCurrency: "KRW",
  priceEok: 12.6,
  priceUsdK: 840,
  rentManwon: 2800,
  yieldPct: 2.5,
  ratePct: 4.0,
  depPct: 30,
  opMonths: 11,
  costPct: 5, // 연간 정비·운송·보험 비용 (장비가격 대비 %)
};

const EXAMPLE = {
  mode: "price",
  fx: 1500,
  priceCurrency: "KRW",
  priceEok: 12.6,
  priceUsdK: 840,
  rentManwon: 2800,
  yieldPct: 2.22,
  ratePct: 4.0,
  depPct: 30,
  opMonths: 11,
  costPct: 5,
};

function Stepper({ onMinus, onPlus, color, disabled }) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <button
        onClick={onPlus}
        disabled={disabled}
        className={
          "w-9 h-9 rounded-full text-white text-lg font-black flex items-center justify-center transition-transform shadow-[0_3px_0_rgba(0,0,0,0.15)] " +
          (disabled
            ? "opacity-40 cursor-not-allowed"
            : "active:scale-90 active:shadow-none active:translate-y-[3px]")
        }
        style={{ backgroundColor: color }}
      >
        +
      </button>
      <button
        onClick={onMinus}
        disabled={disabled}
        className={
          "w-9 h-9 rounded-full text-white text-lg font-black flex items-center justify-center transition-transform shadow-[0_3px_0_rgba(0,0,0,0.15)] " +
          (disabled
            ? "opacity-40 cursor-not-allowed"
            : "active:scale-90 active:shadow-none active:translate-y-[3px]")
        }
        style={{ backgroundColor: color, opacity: disabled ? 0.4 : 0.75 }}
      >
        −
      </button>
    </div>
  );
}

function Badge({ isInput }) {
  return (
    <span
      className={
        "text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide " +
        (isInput ? "bg-white/70 text-slate-600" : "bg-black/10 text-slate-500")
      }
    >
      {isInput ? "✏️ 내가 입력" : "🧮 자동 계산"}
    </span>
  );
}

function Dial({ emoji, label, sub, value, display, onChange, min, max, step, palette, isInput, disabled }) {
  return (
    <div
      className="rounded-3xl p-4 sm:p-5 border-4"
      style={{ backgroundColor: palette.bg, borderColor: palette.ring, opacity: disabled ? 0.65 : 1 }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{emoji}</span>
          <div>
            <div className="font-black text-[15px]" style={{ color: palette.text }}>
              {label}
            </div>
            {sub && <div className="text-[11px] text-slate-500 font-semibold">{sub}</div>}
          </div>
        </div>
        {isInput !== undefined && <Badge isInput={isInput} />}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div
          className="flex-1 rounded-2xl px-3 py-2 text-center font-mono font-black text-[22px] sm:text-[26px] text-white shadow-inner"
          style={{ backgroundColor: palette.text }}
        >
          {display}
        </div>
        <Stepper
          color={palette.text}
          disabled={disabled}
          onPlus={() => onChange(Math.min(max, +(value + step).toFixed(6)))}
          onMinus={() => onChange(Math.max(min, +(value - step).toFixed(6)))}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={"w-full mt-4 " + (disabled ? "cursor-not-allowed" : "cursor-pointer")}
        style={{ accentColor: palette.ring, height: 8 }}
      />
    </div>
  );
}

function PillToggle({ options, value, onChange, color }) {
  return (
    <div className="inline-flex rounded-full p-1 gap-1" style={{ backgroundColor: "#fff" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={
            "px-3 py-1 rounded-full text-[12px] font-black transition-all " +
            (value === opt.value ? "text-white scale-105" : "text-slate-400")
          }
          style={{ backgroundColor: value === opt.value ? color : "transparent" }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function EquipmentCalcGame() {
  const [mode, setMode] = useState(DEFAULTS.mode);
  const [fx, setFx] = useState(DEFAULTS.fx);
  const [priceCurrency, setPriceCurrency] = useState(DEFAULTS.priceCurrency);
  const [priceEok, setPriceEok] = useState(DEFAULTS.priceEok);
  const [priceUsdK, setPriceUsdK] = useState(DEFAULTS.priceUsdK);
  const [rentManwon, setRentManwon] = useState(DEFAULTS.rentManwon);
  const [yieldPct, setYieldPct] = useState(DEFAULTS.yieldPct);
  const [ratePct, setRatePct] = useState(DEFAULTS.ratePct);
  const [depPct, setDepPct] = useState(DEFAULTS.depPct);
  const [opMonths, setOpMonths] = useState(DEFAULTS.opMonths);
  const [costPct, setCostPct] = useState(DEFAULTS.costPct);

  const loadExample = () => {
    setMode(EXAMPLE.mode);
    setFx(EXAMPLE.fx);
    setPriceCurrency(EXAMPLE.priceCurrency);
    setPriceEok(EXAMPLE.priceEok);
    setPriceUsdK(EXAMPLE.priceUsdK);
    setRentManwon(EXAMPLE.rentManwon);
    setYieldPct(EXAMPLE.yieldPct);
    setRatePct(EXAMPLE.ratePct);
    setDepPct(EXAMPLE.depPct);
    setOpMonths(EXAMPLE.opMonths);
    setCostPct(EXAMPLE.costPct);
  };

  const reset = () => {
    setMode(DEFAULTS.mode);
    setFx(DEFAULTS.fx);
    setPriceCurrency(DEFAULTS.priceCurrency);
    setPriceEok(DEFAULTS.priceEok);
    setPriceUsdK(DEFAULTS.priceUsdK);
    setRentManwon(DEFAULTS.rentManwon);
    setYieldPct(DEFAULTS.yieldPct);
    setRatePct(DEFAULTS.ratePct);
    setDepPct(DEFAULTS.depPct);
    setOpMonths(DEFAULTS.opMonths);
    setCostPct(DEFAULTS.costPct);
  };

  const y = (yieldPct || 0) / 100;
  const opM = opMonths || 0;
  const rate = ratePct || 0;

  // 사람이 직접 입력한 값(raw)
  const rawPriceWon = useMemo(
    () => (priceCurrency === "USD" ? priceUsdK * 1000 * (fx || 0) : priceEok * 1e8),
    [priceCurrency, priceUsdK, priceEok, fx]
  );
  const rawRentWon = rentManwon * 1e4;

  // 실제 계산에 쓰는 값: mode 쪽은 raw 그대로, 반대쪽은 수익률로 역산
  const effectivePriceWon = mode === "price" ? rawPriceWon : y > 0 ? rawRentWon / y : Infinity;
  const effectiveRentWon = mode === "rent" ? rawRentWon : rawPriceWon * y;

  // 장비가격 다이얼에 보여줄 값 (mode가 price면 raw, 아니면 역산값을 현재 통화로 변환)
  const priceDialValue =
    mode === "price"
      ? priceCurrency === "USD"
        ? priceUsdK
        : priceEok
      : priceCurrency === "USD"
      ? effectivePriceWon / (fx || 1) / 1000
      : effectivePriceWon / 1e8;

  const onPriceDialChange = (v) => {
    if (mode !== "price") return; // 임대료 고정 모드에서는 장비가격이 계산결과라 편집 불가
    if (priceCurrency === "USD") setPriceUsdK(v);
    else setPriceEok(v);
  };

  const rentDialValue = mode === "rent" ? rentManwon : effectiveRentWon / 1e4;
  const onRentDialChange = (v) => {
    if (mode !== "rent") return; // 장비가격 고정 모드에서는 임대료가 계산결과라 편집 불가
    setRentManwon(v);
  };

  const grossAnnualYield = y * opM * 100; // 비용 반영 전 총 임대수익률(연)
  const netAnnualYield = grossAnnualYield - (costPct || 0); // 정비·운송·보험비 차감 후 순수익률(연)
  const annualOpCostWon = effectivePriceWon * ((costPct || 0) / 100);
  const netAnnualIncomeWon = effectiveRentWon * opM - annualOpCostWon;
  const paybackMonths =
    netAnnualIncomeWon > 0 ? (effectivePriceWon / netAnnualIncomeWon) * 12 : Infinity;
  const spread = netAnnualYield - rate;

  // ---- 3년 보유 시나리오 (정비 등 비용 차감 반영) ----
  const threeYr = useMemo(() => {
    const price = effectivePriceWon;
    const rent = effectiveRentWon;
    const resale = price * (1 - (depPct || 0) / 100);
    const rentTotal = rent * opM * 3;
    const opCostTotal = price * ((costPct || 0) / 100) * 3;
    const totalCashIn = rentTotal - opCostTotal + resale;
    const netProfit = totalCashIn - price;
    const cagr = price > 0 && totalCashIn > 0 ? (Math.pow(totalCashIn / price, 1 / 3) - 1) * 100 : NaN;
    return { resale, rentTotal, opCostTotal, totalCashIn, netProfit, cagr };
  }, [effectivePriceWon, effectiveRentWon, depPct, opM, costPct]);

  return (
    <div
      className="min-h-full w-full"
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "linear-gradient(160deg,#6D28D9 0%,#DB2777 45%,#F59E0B 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-7 sm:px-8 sm:py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 mb-3">
            <PartyPopper size={16} className="text-yellow-300" />
            <span className="text-white text-[12px] font-black tracking-wide">
              장비가 · 임대료 한번에 계산!
            </span>
          </div>
          <h1 className="text-white text-3xl sm:text-4xl font-black drop-shadow-[0_3px_0_rgba(0,0,0,0.15)]">
            🏗️ 적정가 계산 게임기
          </h1>
          <p className="text-white/90 text-[13px] sm:text-[14px] font-semibold mt-2">
            둘 중 하나를 고정하면, 다른 하나를 계산해드려요
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={loadExample}
              className="bg-yellow-300 text-purple-900 font-black text-[12px] px-4 py-2 rounded-full shadow-[0_4px_0_#B45309] active:shadow-none active:translate-y-1 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={14} /> 예시값 불러오기
            </button>
            <button
              onClick={reset}
              className="bg-white/90 text-slate-700 font-black text-[12px] px-4 py-2 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> 초기화
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setMode("price")}
            className={
              "rounded-2xl p-3.5 text-left border-4 transition-all " +
              (mode === "price" ? "bg-white border-yellow-300 scale-[1.02]" : "bg-white/70 border-transparent")
            }
          >
            <div className="text-[11px] font-black text-orange-500 mb-0.5">기능 ①</div>
            <div className="font-black text-slate-800 text-[14px]">🏗️ 장비가격 고정 → 💰 임대료 산정</div>
          </button>
          <button
            onClick={() => setMode("rent")}
            className={
              "rounded-2xl p-3.5 text-left border-4 transition-all " +
              (mode === "rent" ? "bg-white border-yellow-300 scale-[1.02]" : "bg-white/70 border-transparent")
            }
          >
            <div className="text-[11px] font-black text-orange-500 mb-0.5">기능 ②</div>
            <div className="font-black text-slate-800 text-[14px]">💰 임대료 고정 → 🏗️ 장비가격 산정</div>
          </button>
        </div>

        {/* Dials */}
        <div className="bg-white/10 backdrop-blur rounded-[28px] p-4 sm:p-5 mb-5">
          <div className="text-[11px] font-black text-white/80 tracking-wide uppercase mb-2 pl-1">
            🎯 핵심 두 값 — 색이 진한 쪽이 지금 고정(입력) 값이에요
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {/* 장비가격 다이얼 — 입력해도 되고, 자동계산 결과로 봐도 됨 */}
            <div
              className="rounded-3xl p-4 sm:p-5 border-4"
              style={{
                backgroundColor: COLORS.price.bg,
                borderColor: COLORS.price.ring,
                opacity: mode === "price" ? 1 : 0.65,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">🏗️</span>
                  <div className="font-black text-[15px]" style={{ color: COLORS.price.text }}>
                    장비가격
                  </div>
                </div>
                <Badge isInput={mode === "price"} />
              </div>
              <div className="flex items-center justify-between mt-1 mb-1">
                <PillToggle
                  value={priceCurrency}
                  onChange={setPriceCurrency}
                  color={COLORS.price.text}
                  options={[
                    { value: "KRW", label: "원화" },
                    { value: "USD", label: "달러" },
                  ]}
                />
              </div>
              {priceCurrency === "KRW" ? (
                <>
                  <div className="flex items-center gap-3 mt-3">
                    <div
                      className="flex-1 rounded-2xl px-3 py-2 text-center font-mono font-black text-[22px] sm:text-[26px] text-white shadow-inner"
                      style={{ backgroundColor: COLORS.price.text }}
                    >
                      {priceDialValue.toFixed(1)}억원
                    </div>
                    <Stepper
                      color={COLORS.price.text}
                      disabled={mode !== "price"}
                      onPlus={() => onPriceDialChange(Math.min(50, +(priceDialValue + 0.1).toFixed(1)))}
                      onMinus={() => onPriceDialChange(Math.max(0.5, +(priceDialValue - 0.1).toFixed(1)))}
                    />
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={50}
                    step={0.1}
                    value={Math.min(50, Math.max(0.5, priceDialValue))}
                    disabled={mode !== "price"}
                    onChange={(e) => onPriceDialChange(parseFloat(e.target.value))}
                    className={"w-full mt-4 " + (mode !== "price" ? "cursor-not-allowed" : "cursor-pointer")}
                    style={{ accentColor: COLORS.price.ring, height: 8 }}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mt-3">
                    <div
                      className="flex-1 rounded-2xl px-3 py-2 text-center font-mono font-black text-[20px] sm:text-[24px] text-white shadow-inner"
                      style={{ backgroundColor: COLORS.price.text }}
                    >
                      ${priceDialValue.toFixed(0)}K
                    </div>
                    <Stepper
                      color={COLORS.price.text}
                      disabled={mode !== "price"}
                      onPlus={() => onPriceDialChange(Math.min(3000, priceDialValue + 10))}
                      onMinus={() => onPriceDialChange(Math.max(50, priceDialValue - 10))}
                    />
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={3000}
                    step={10}
                    value={Math.min(3000, Math.max(50, priceDialValue))}
                    disabled={mode !== "price"}
                    onChange={(e) => onPriceDialChange(parseFloat(e.target.value))}
                    className={"w-full mt-4 " + (mode !== "price" ? "cursor-not-allowed" : "cursor-pointer")}
                    style={{ accentColor: COLORS.price.ring, height: 8 }}
                  />
                </>
              )}
              <p className="text-[11px] font-bold mt-2" style={{ color: COLORS.price.text }}>
                ≈ {fmtEok(effectivePriceWon)} · {fmtUsd(effectivePriceWon / (fx || 1))}
              </p>
            </div>

            {/* 임대료 다이얼 */}
            <Dial
              emoji="💰"
              label="월 임대료"
              sub="만원 / 월"
              value={rentDialValue}
              display={rentDialValue.toFixed(0) + "만원"}
              onChange={onRentDialChange}
              disabled={mode !== "rent"}
              min={100}
              max={10000}
              step={50}
              palette={COLORS.rent}
              isInput={mode === "rent"}
            />
          </div>

          <div className="text-[11px] font-black text-white/80 tracking-wide uppercase mb-2 pl-1">
            ⚙️ 세부 변수
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dial
              emoji="💵"
              label="달러 환율"
              sub="원 / US$"
              value={fx}
              display={fx.toLocaleString() + "원"}
              onChange={setFx}
              min={1000}
              max={2000}
              step={10}
              palette={COLORS.fx}
            />

            <Dial
              emoji="📈"
              label="목표 월 수익률"
              sub="장비가 대비 %/월 · 국제참고 2.3~2.8%"
              value={yieldPct}
              display={fmtPct(yieldPct)}
              onChange={setYieldPct}
              min={0.3}
              max={5}
              step={0.05}
              palette={COLORS.yieldc}
            />

            <Dial
              emoji="🏦"
              label="참고 금리"
              sub="연 %, 대출이자율 비교용"
              value={ratePct}
              display={fmtPct(ratePct, 1)}
              onChange={setRatePct}
              min={0}
              max={12}
              step={0.1}
              palette={COLORS.rate}
            />

            <Dial
              emoji="🔧"
              label="정비·운송·보험비"
              sub="연간, 장비가격 대비 %"
              value={costPct}
              display={"−" + fmtPct(costPct, 1)}
              onChange={setCostPct}
              min={0}
              max={20}
              step={0.5}
              palette={COLORS.cost}
            />

            <Dial
              emoji="📉"
              label="3년 후 중고가 할인율"
              sub="신차가 대비 % 하락"
              value={depPct}
              display={"−" + depPct + "%"}
              onChange={setDepPct}
              min={0}
              max={70}
              step={1}
              palette={COLORS.dep}
            />

            <Dial
              emoji="🗓️"
              label="연간 가동월수"
              sub="1년 중 실제로 임대료가 발생하는 개월 수"
              value={opMonths}
              display={opMonths + "개월/년"}
              onChange={(v) => setOpMonths(Math.round(v))}
              min={1}
              max={12}
              step={1}
              palette={COLORS.op}
            />
          </div>
        </div>

        {/* Result - jackpot style */}
        <div className="bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-300 rounded-[28px] p-5 sm:p-6 border-4 border-white shadow-[0_8px_0_rgba(0,0,0,0.15)] mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={18} className="text-orange-700" />
            <span className="text-orange-800 font-black text-[13px] tracking-wide uppercase">
              {mode === "price" ? "🏗️ 장비가격을 입력했어요 → 적정 월 임대료는..." : "💰 임대료를 입력했어요 → 적정 장비가격은..."}
            </span>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-6xl font-black text-orange-900 font-mono drop-shadow-sm">
              {mode === "price" ? fmtManwon(effectiveRentWon, 0) : fmtEok(effectivePriceWon)}
            </div>
            <div className="text-orange-800/80 text-[12px] font-bold mt-1">
              {mode === "price"
                ? `${fmtEok(effectivePriceWon)} × 월 ${fmtPct(yieldPct)}`
                : `${fmtManwon(effectiveRentWon)} ÷ 월 ${fmtPct(yieldPct)}`}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div className="bg-white/70 rounded-2xl p-3 text-center">
              <TrendingUp size={14} className="mx-auto text-orange-600 mb-1" />
              <div className="text-[10px] font-bold text-orange-700">총 임대수익률(연)</div>
              <div className="font-mono font-black text-[15px] text-orange-900">{fmtPct(grossAnnualYield, 1)}</div>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 text-center">
              <Wrench size={14} className="mx-auto text-orange-600 mb-1" />
              <div className="text-[10px] font-bold text-orange-700">순수익률(비용차감후)</div>
              <div
                className="font-mono font-black text-[15px]"
                style={{ color: netAnnualYield >= 0 ? "#7C2D12" : "#B91C1C" }}
              >
                {fmtPct(netAnnualYield, 1)}
              </div>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 text-center">
              <Truck size={14} className="mx-auto text-orange-600 mb-1" />
              <div className="text-[10px] font-bold text-orange-700">투자 회수기간</div>
              <div className="font-mono font-black text-[15px] text-orange-900">
                {isFinite(paybackMonths) ? paybackMonths.toFixed(1) + "개월" : "—"}
              </div>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 text-center">
              <Landmark size={14} className="mx-auto text-orange-600 mb-1" />
              <div className="text-[10px] font-bold text-orange-700">금리 스프레드</div>
              <div
                className="font-mono font-black text-[15px]"
                style={{ color: spread >= 0 ? "#15803D" : "#B91C1C" }}
              >
                {spread >= 0 ? "+" : ""}
                {fmtPct(spread, 1)}p
              </div>
            </div>
          </div>
          <p className="text-orange-800/70 text-[10.5px] font-semibold text-center mt-2">
            순수익률 = 총 임대수익률({fmtPct(grossAnnualYield, 1)}) − 정비·운송·보험비({fmtPct(costPct, 1)}) · 회수기간·스프레드는 순수익률 기준
          </p>

          <div
            className="mt-4 rounded-2xl p-3.5 text-[12.5px] font-bold leading-relaxed text-center"
            style={{
              backgroundColor: spread >= 0 ? "#DCFCE7" : "#FEE2E2",
              color: spread >= 0 ? "#166534" : "#991B1B",
            }}
          >
            {spread >= 0
              ? `🎉 대출이자보다 ${fmtPct(Math.abs(spread), 1)}p 더 벌어요! 투자 매력 있음`
              : `⚠️ 대출이자보다 ${fmtPct(Math.abs(spread), 1)}p 부족해요. 조건을 다시 조절해보세요`}
          </div>
        </div>

        {/* 3-year resale scenario */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border-4 border-emerald-300">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📉</span>
            <div>
              <div className="font-black text-emerald-700 text-[15px]">3년 보유 후 되팔면?</div>
              <div className="text-[11px] text-slate-500 font-semibold">
                중고가 할인율({depPct}%) · 연간 가동월수({opMonths}개월)를 반영한 3년 총수익 시나리오
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-emerald-700 mb-1">3년 누적 임대료</div>
              <div className="font-mono font-black text-[14px] text-emerald-900">{fmtEok(threeYr.rentTotal)}</div>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-red-600 mb-1">3년 정비·운송·보험비</div>
              <div className="font-mono font-black text-[14px] text-red-700">−{fmtEok(threeYr.opCostTotal)}</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-emerald-700 mb-1">3년 후 중고값</div>
              <div className="font-mono font-black text-[14px] text-emerald-900">{fmtEok(threeYr.resale)}</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-emerald-700 mb-1">3년 순수익</div>
              <div
                className="font-mono font-black text-[14px]"
                style={{ color: threeYr.netProfit >= 0 ? "#047857" : "#B91C1C" }}
              >
                {threeYr.netProfit >= 0 ? "+" : ""}
                {fmtEok(threeYr.netProfit)}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-emerald-700 mb-1">연환산 총수익률</div>
              <div
                className="font-mono font-black text-[14px]"
                style={{ color: threeYr.cagr >= 0 ? "#047857" : "#B91C1C" }}
              >
                {fmtPct(threeYr.cagr, 1)}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold mt-3 text-center">
            3년 순수익 = (월 임대료 × 가동월수 {opMonths}개월 × 3년) − (장비가격 × 정비등비용 {fmtPct(costPct, 1)} × 3년) + 3년 후 중고값 − 최초 장비가격
          </p>
        </div>

        <p className="text-center text-white/70 text-[11px] font-semibold mt-5">
          🎮 위에서 기능 ①·② 중 하나를 고르고, 진하게 표시된 쪽 다이얼만 움직이면 나머지는 자동으로 계산돼요.
        </p>
      </div>
    </div>
  );
}
