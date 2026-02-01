# Metabolic Command Center

A high-performance, private health dashboard designed for bio-optimization and metabolic health tracking.

## 🧬 Project Mission
To transform raw physiological data (Lab results, Apple Health, CGM) into actionable insights, focusing on metabolic efficiency (HbA1c, glucose), cardiovascular capacity (VO2max, RHR), and recovery (HRV, Sleep).

---

## 🏗️ Architecture: The Dual-Store System

### 1. Raw Data Store (Input)
Located in `data/` (local workspace). Contains:
- `xml_archive/`: Historical lab records (record_1 to record_5).
- `apple_health/`: Massive 800MB `export.xml` and high-resolution CDA records.
- `cgm_history_2022_2026.csv`: Four years of continuous glucose data.

### 2. Processed Compendium (The Dashboard Engine)
Located in `src/data/` (repository). 
Contains surgically extracted, normalized, and deduped time-series JSON files:
- `labs_master.json`: All blood work and lipid panels.
- `vitals_master.json`: RHR, HRV, VO2max, BP, and Body Temp.
- `activity_master.json`: Active energy, steps, cycling, and intensity.
- `sleep_master.json`: Full duration and detailed stages (Core, Deep, REM).

---

## 🛠️ Execution Strategy & Task List

### Phase 1: Core Data Infrastructure (IN PROGRESS)
- [x] Establish permanent Processed Store architecture.
- [x] Develop Surgical Extraction Protocol (ISO 8601 normalization + strict deduping).
- [x] Initial migration of historical Labs and NMR data.
- [x] Initial migration of Apple Health biometrics (Vitals, Activity, Sleep).
- [x] Setup deployment workflow (Local Sync -> Repo Mirror -> Git Push).

### Phase 2: The "Tactical Obsidian" UI Shell (IN PROGRESS)
*Design Goal: High-density, clinical-grade monitoring aesthetic with a deep charcoal palette and glass-morphism depth.*
- [x] Implement master HTML structure using the high-performance Obsidian theme (`#050505` background).
- [x] Configure Tailwind CSS and technical typography (`JetBrains Mono` for metrics, `Inter` for reading).
- [x] Build the **Vital Pulse Strip** (Global Summary):
    - Real-time aggregates: Current VO2max, Latest HbA1c, Liver Status (🟢/🟡), 7-day Avg Sleep.
- [x] Build the **War Room (Mission Cards)** for goal-tracking:
    - [x] **HbA1c Reduction:** Target < 5.5 progress ring.
    - [x] **VO2max Climb:** Sparkline tracking recovery from Dec low (33.6) back toward baseline (50.1).
    - [x] **Metabolic Resilience:** ALT/AST trend monitoring.
- [x] Implement **Temporal Engine** immersive chart area:
    - [x] Interactive **"Metric Switcher"**: A searchable dropdown/omni-bar providing instant access to **every single metric** available in the `labs`, `vitals`, `activity`, and `sleep` master files. Selecting any metric instantly repopulates the Temporal Engine chart.
    - [x] Immersive Chart.js container with time-scale toggles (1M, 1Y, All-Time).
- [x] Signature details: Startup "scanning" sequence, Compendium sync light, and milestone visual celebrations.

### Phase 3: The Temporal Analysis Engine (IN PROGRESS)
- [x] Implement `HealthDataManager` JS utility to fetch and process `src/data/*.json`.
- [x] Build the **Metric Switcher** interactive chart area.
- [ ] Implement dual-metric overlay (e.g., correlate Cycling Intensity vs. HRV recovery).
- [x] Add time-scale toggles (1M, 1Y, All-Time).

### Phase 4: Proactive Intelligence
- [ ] Add "Compendium Status" indicator (visualizing new data drops).
- [ ] Add goal milestone celebrations and trend alerts.
- [ ] Finalize GitHub Pages deployment or local hosting scripts.

---

## 🔄 Replicable Update Protocol (SOP)
When new raw data is provided:
1. **Identify Source:** Map new file type to existing extraction scripts.
2. **Surgical Pull:** Extract only metrics defined in `dashboard-metrics-config.md`.
3. **Temporal Tagging:** Assign every value an ISO 8601 timestamp.
4. **Deduplicate:** Cross-reference against `src/data/` to ensure no overlaps.
5. **Mirror & Push:** Update repo data and commit to GitHub.

---
*Maintained by Proteus AI Health Coach.*
