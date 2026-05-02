#!/usr/bin/env python3
"""
Calculator PFA sistem real vs SRL Micro pentru Romania 2026.

Compară taxele totale pentru același venit anual între:
  - PFA sistem real (10% impozit + CAS + CASS)
  - SRL Micro (1% impozit pe venit, dar +1 angajat obligatoriu)

Notă: cifrele sunt ESTIMATIVE. Verifică cu contabilul tău înainte de decizie.
Bazate pe legislația 2026 (1% reintrodus pentru SRL Micro).

Usage:
    python3 scripts/pfa_vs_srl_calculator.py                     # default: scenarii 20k/50k/100k EUR
    python3 scripts/pfa_vs_srl_calculator.py --revenue 75000     # 1 scenariu specific (EUR)
    python3 scripts/pfa_vs_srl_calculator.py --expenses-pct 30   # cheltuieli ca % din venit
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

# === Constante 2026 (RON) ===
EUR_RON = 4.97  # curs estimativ BNR

# Salariu minim brut 2026 (necesar pentru SRL Micro - 1 angajat)
SALARIU_MINIM_BRUT_LUNAR = 4050  # RON brut, conform HG 2026
SALARIU_MINIM_BRUT_ANUAL = SALARIU_MINIM_BRUT_LUNAR * 12

# Contribuții salariale (% din salariu brut)
CAS_SALARIAT_PCT = 0.25  # 25% pensie
CASS_SALARIAT_PCT = 0.10  # 10% sănătate
IMPOZIT_SALARIAL_PCT = 0.10  # 10% impozit pe venitul salarial
CAM_ANGAJATOR_PCT = 0.0225  # 2.25% asigurare muncă (suportat angajator)

# PFA sistem real
PFA_IMPOZIT_PCT = 0.10
# Plafoane CAS PFA 2026 — bazate pe nr. salarii minime brute pe care alegi
# 12 sm = 48.600 RON; 24 sm = 97.200 RON
PFA_CAS_PCT = 0.25  # aplicat pe baza aleasă (12, 24 sau 36 sm)
# Plafoane CASS PFA 2026 — similar
PFA_CASS_PCT = 0.10  # aplicat pe baza aleasă

# Praguri sm pentru CAS/CASS PFA (în nr. salarii minime brute anuale)
SM_THRESHOLD_12 = 12 * SALARIU_MINIM_BRUT_LUNAR  # 48.600 RON venit net → CAS pe 12 sm
SM_THRESHOLD_24 = 24 * SALARIU_MINIM_BRUT_LUNAR  # 97.200 RON
SM_THRESHOLD_60 = 60 * SALARIU_MINIM_BRUT_LUNAR  # 243.000 RON

# SRL Micro
SRL_MICRO_IMPOZIT_PCT = 0.01  # 1% pe venit (cifra afaceri)
SRL_DIVIDENDE_IMPOZIT_PCT = 0.10  # 10% impozit pe dividende
SRL_DIVIDENDE_CASS_PCT = 0.10  # 10% CASS pe dividende (dacă > 6/12/24 sm)

# Costuri operaționale tipice
COST_CONTABIL_PFA_LUNAR = 200  # RON/lună contabil PFA
COST_CONTABIL_SRL_LUNAR = 400  # RON/lună contabil SRL
COST_INFIINTARE_SRL = 1500  # RON one-shot (notar + ONRC + cheltuieli)


@dataclass
class TaxResult:
    revenue_ron: float
    expenses_ron: float
    profit_brut: float
    impozit: float
    cas: float
    cass: float
    salarii_si_contributii: float
    contabil_anual: float
    total_taxe: float
    venit_net_in_buzunar: float
    detalii: str

    @property
    def efficient_pct(self) -> float:
        return (self.total_taxe / self.revenue_ron * 100) if self.revenue_ron else 0


def calc_pfa_real(revenue_ron: float, expenses_ron: float) -> TaxResult:
    """PFA sistem real: 10% impozit + CAS + CASS pe baza aleasă."""
    profit_brut = max(revenue_ron - expenses_ron, 0)

    # CAS: alegi baza (12, 24, 60 sm) în funcție de venit net
    if profit_brut < SM_THRESHOLD_12:
        cas_baza = 0  # sub plafon, opțional
        cas = 0
    elif profit_brut < SM_THRESHOLD_24:
        cas_baza = SM_THRESHOLD_12
        cas = cas_baza * PFA_CAS_PCT
    elif profit_brut < SM_THRESHOLD_60:
        cas_baza = SM_THRESHOLD_24
        cas = cas_baza * PFA_CAS_PCT
    else:
        cas_baza = SM_THRESHOLD_60
        cas = cas_baza * PFA_CAS_PCT

    # CASS: aplicat pe profit_brut sau pe plafon, oricare e mai mic
    cass_baza = min(profit_brut, SM_THRESHOLD_60)
    cass = cass_baza * PFA_CASS_PCT

    # Impozit pe venit: 10% pe (profit_brut - CAS deductibil)
    # CAS este deductibil din baza impozabilă a impozitului pe venit
    baza_impozit = max(profit_brut - cas, 0)
    impozit = baza_impozit * PFA_IMPOZIT_PCT

    contabil = COST_CONTABIL_PFA_LUNAR * 12
    total_taxe = impozit + cas + cass + contabil
    venit_net = revenue_ron - expenses_ron - total_taxe

    detalii = (
        f"  Profit brut: {profit_brut:,.0f} RON\n"
        f"  CAS (25% pe {cas_baza:,.0f}): {cas:,.0f} RON\n"
        f"  CASS (10% pe {cass_baza:,.0f}): {cass:,.0f} RON\n"
        f"  Impozit (10% pe {baza_impozit:,.0f}): {impozit:,.0f} RON\n"
        f"  Contabil anual: {contabil:,.0f} RON"
    )

    return TaxResult(
        revenue_ron=revenue_ron,
        expenses_ron=expenses_ron,
        profit_brut=profit_brut,
        impozit=impozit,
        cas=cas,
        cass=cass,
        salarii_si_contributii=0,
        contabil_anual=contabil,
        total_taxe=total_taxe,
        venit_net_in_buzunar=venit_net,
        detalii=detalii,
    )


def calc_srl_micro(revenue_ron: float, expenses_ron: float) -> TaxResult:
    """SRL Micro: 1% pe venit + salariu minim obligatoriu (1 angajat) + dividende."""
    # 1. Impozit micro 1% pe venit (cifra afaceri, NU profit)
    impozit_micro = revenue_ron * SRL_MICRO_IMPOZIT_PCT

    # 2. Salariul minim — Alex e angajatul propriu, costuri totale:
    # CAS 25% + CASS 10% + impozit 10% (suportate de angajat, dar firma plătește bani brut)
    # CAM 2.25% (suportat de angajator, cost suplimentar firmei)
    salariu_brut = SALARIU_MINIM_BRUT_ANUAL
    cas_salariat = salariu_brut * CAS_SALARIAT_PCT
    cass_salariat = salariu_brut * CASS_SALARIAT_PCT
    impozit_salarial = (salariu_brut - cas_salariat - cass_salariat) * IMPOZIT_SALARIAL_PCT
    cam_angajator = salariu_brut * CAM_ANGAJATOR_PCT
    salariu_net_alex = salariu_brut - cas_salariat - cass_salariat - impozit_salarial
    cost_total_salarii = salariu_brut + cam_angajator
    contributii_salarii_la_stat = cas_salariat + cass_salariat + impozit_salarial + cam_angajator

    # 3. După micro + salariu, profit rămas se distribuie ca dividende
    # Cheltuieli SRL = expenses_ron + salariul brut + CAM + contabil
    contabil = COST_CONTABIL_SRL_LUNAR * 12
    cheltuieli_srl = expenses_ron + cost_total_salarii + contabil
    profit_dupa_cheltuieli = revenue_ron - cheltuieli_srl - impozit_micro
    # Notă: micro nu se aplică pe profit, ci pe revenue. Dar micro se DEDUCE înainte de dividende.
    # Practic: revenue - micro impozit - cheltuieli (incl salarii) = profit distribuibil

    profit_distribuibil = max(profit_dupa_cheltuieli, 0)

    # 4. Impozit pe dividende: 10%
    impozit_dividende = profit_distribuibil * SRL_DIVIDENDE_IMPOZIT_PCT
    # 5. CASS dividende dacă cumul venit pasiv > 6 sm (adesea aplicabil): 10% pe minim
    # Simplificare: aplicăm CASS pe pragul minim 6 sm dacă dividendele > 6sm
    if profit_distribuibil > 6 * SALARIU_MINIM_BRUT_LUNAR:
        cass_dividende = 6 * SALARIU_MINIM_BRUT_LUNAR * SRL_DIVIDENDE_CASS_PCT
    else:
        cass_dividende = 0

    dividende_in_buzunar = profit_distribuibil - impozit_dividende - cass_dividende

    # Total bani în buzunarul lui Alex = salariu net + dividende net
    venit_net_total = salariu_net_alex + dividende_in_buzunar

    # Total taxe (toate contribuțiile la stat, indiferent de cine le plătește)
    total_taxe = (
        impozit_micro
        + contributii_salarii_la_stat
        + impozit_dividende
        + cass_dividende
        + contabil
    )

    detalii = (
        f"  Impozit micro 1% pe venit: {impozit_micro:,.0f} RON\n"
        f"  Salariu brut Alex (12 luni): {salariu_brut:,.0f} RON\n"
        f"  Contribuții + impozit salarial: {contributii_salarii_la_stat:,.0f} RON\n"
        f"  Salariu net (în buzunar): {salariu_net_alex:,.0f} RON\n"
        f"  Profit pentru dividende: {profit_distribuibil:,.0f} RON\n"
        f"  Impozit dividende 10%: {impozit_dividende:,.0f} RON\n"
        f"  CASS dividende: {cass_dividende:,.0f} RON\n"
        f"  Dividende net: {dividende_in_buzunar:,.0f} RON\n"
        f"  Contabil anual: {contabil:,.0f} RON\n"
        f"  TOTAL bani în buzunar (salariu + dividende): {venit_net_total:,.0f} RON"
    )

    return TaxResult(
        revenue_ron=revenue_ron,
        expenses_ron=expenses_ron,
        profit_brut=revenue_ron - expenses_ron,
        impozit=impozit_micro + impozit_dividende,
        cas=cas_salariat,
        cass=cass_salariat + cass_dividende,
        salarii_si_contributii=contributii_salarii_la_stat,
        contabil_anual=contabil,
        total_taxe=total_taxe,
        venit_net_in_buzunar=venit_net_total,
        detalii=detalii,
    )


def print_scenario(revenue_eur: float, expenses_pct: float = 15.0):
    revenue_ron = revenue_eur * EUR_RON
    expenses_ron = revenue_ron * expenses_pct / 100

    print(f"\n{'='*70}")
    print(f"SCENARIU: {revenue_eur:,.0f} EUR/an (≈ {revenue_ron:,.0f} RON)")
    print(f"Cheltuieli operaționale: {expenses_pct}% = {expenses_ron:,.0f} RON")
    print(f"{'='*70}")

    pfa = calc_pfa_real(revenue_ron, expenses_ron)
    srl = calc_srl_micro(revenue_ron, expenses_ron)

    print(f"\n📋 PFA SISTEM REAL")
    print(pfa.detalii)
    print(f"  ─────")
    print(f"  TOTAL TAXE: {pfa.total_taxe:,.0f} RON ({pfa.efficient_pct:.1f}% din venit)")
    print(f"  ÎN BUZUNAR: {pfa.venit_net_in_buzunar:,.0f} RON ({pfa.venit_net_in_buzunar / EUR_RON:,.0f} EUR)")

    print(f"\n🏢 SRL MICRO (1%)")
    print(srl.detalii)
    print(f"  ─────")
    print(f"  TOTAL TAXE: {srl.total_taxe:,.0f} RON ({srl.efficient_pct:.1f}% din venit)")
    print(f"  ÎN BUZUNAR: {srl.venit_net_in_buzunar:,.0f} RON ({srl.venit_net_in_buzunar / EUR_RON:,.0f} EUR)")

    diff = srl.venit_net_in_buzunar - pfa.venit_net_in_buzunar
    diff_eur = diff / EUR_RON

    print(f"\n🎯 VERDICT")
    if diff > 0:
        print(f"  → SRL Micro e cu {diff:,.0f} RON ({diff_eur:,.0f} EUR) MAI BUN/an")
    else:
        print(f"  → PFA Real e cu {-diff:,.0f} RON ({-diff_eur:,.0f} EUR) MAI BUN/an")
    print(f"  → Cost înființare SRL one-shot: {COST_INFIINTARE_SRL:,.0f} RON")
    if diff > COST_INFIINTARE_SRL:
        breakeven_luni = COST_INFIINTARE_SRL / (diff / 12)
        print(f"  → Costul înființării SRL se amortizează în {breakeven_luni:.1f} luni")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--revenue", type=float, help="Venit anual în EUR (1 scenariu specific)")
    p.add_argument("--expenses-pct", type=float, default=15.0, help="Cheltuieli ca %% din venit (default 15%%)")
    args = p.parse_args()

    print("\n" + "=" * 70)
    print("CALCULATOR FISCAL PFA REAL vs SRL MICRO · ROMANIA 2026")
    print("=" * 70)
    print(f"Curs EUR/RON folosit: {EUR_RON}")
    print(f"Salariu minim brut 2026: {SALARIU_MINIM_BRUT_LUNAR} RON/lună")
    print(f"DISCLAIMER: cifre estimative. Verifică cu contabilul.")

    if args.revenue:
        print_scenario(args.revenue, args.expenses_pct)
    else:
        for rev in [20000, 50000, 100000, 200000]:
            print_scenario(rev, args.expenses_pct)

    print("\n" + "=" * 70)
    print("RECOMANDARE GENERALĂ:")
    print("- Sub 30k EUR/an: PFA e mai simplu, taxe similare")
    print("- 30-100k EUR/an: SRL Micro începe să bată PFA evident")
    print("- 100k+ EUR/an: SRL Micro DAR atenție la plafon 100k EUR (peste = SRL standard 16%)")
    print("- Plafon TVA 88.5k RON = ~17.7k EUR (sub asta nu plătești TVA, indiferent de formă)")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
