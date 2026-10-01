# OIML R-76 CALCULATION METHODOLOGY DOCUMENTATION
**Standard:** International Recommendation OIML R 76-1 (Edition 2006 E)  
**Title:** Non-automatic weighing instruments — Part 1: Metrological and technical requirements - Tests  
**Module Location:** `backend/app/engine/nawi_calculator.py`  

---

## 1. ACCURACY CLASSES & VERIFICATION SCALE INTERVALS ($e$)

OIML R-76-1 categorizes Non-Automatic Weighing Instruments into four accuracy classes based on the verification scale interval ($e$), number of verification scale intervals ($n = \frac{Max}{e}$), and minimum capacity ($Min$).

| Accuracy Class | Symbol | Verification Scale Interval ($e$) | Minimum Number of Intervals ($n_{min}$) | Maximum Number of Intervals ($n_{max}$) | Minimum Capacity ($Min$) |
|---|---|---|---|---|---|
| **Special** | **Class I** ($\text{I}$) | $0.001\text{ g} \le e$ | $50,000$ | Unlimited | $100e$ |
| **High** | **Class II** ($\text{II}$) | $0.001\text{ g} \le e \le 0.05\text{ g}$ | $100$ | $100,000$ | $20e$ |
| | | $0.1\text{ g} \le e$ | $5,000$ | $100,000$ | $50e$ |
| **Medium** | **Class III** ($\text{III}$) | $0.1\text{ g} \le e \le 2\text{ g}$ | $100$ | $10,000$ | $20e$ |
| | | $5\text{ g} \le e$ | $500$ | $10,000$ | $20e$ |
| **Ordinary** | **Class IIII** ($\text{IIII}$) | $5\text{ g} \le e$ | $100$ | $1,000$ | $10e$ |

---

## 2. MAXIMUM PERMISSIBLE ERRORS (MPE)

Per Clause 3.5.1 of OIML R-76-1, Maximum Permissible Errors on initial verification are defined in terms of verification scale interval $e$ across three load ranges:

### 2.1 Initial Verification MPE Table

| Load $m$ expressed in verification scale intervals $e$ | | | | Maximum Permissible Error (MPE) |
|---|---|---|---|---|
| **Class I** | **Class II** | **Class III** | **Class IIII** | |
| $0 \le m \le 50,000e$ | $0 \le m \le 5,000e$ | $0 \le m \le 500e$ | $0 \le m \le 50e$ | **$\pm 0.5 e$** |
| $50,000e < m \le 200,000e$ | $5,000e < m \le 20,000e$ | $500e < m \le 2,000e$ | $50e < m \le 200e$ | **$\pm 1.0 e$** |
| $200,000e < m$ | $20,000e < m \le 100,000e$ | $2,000e < m \le 10,000e$ | $200e < m \le 1,000e$ | **$\pm 1.5 e$** |

*Note: For in-service inspection, MPE limits are twice the initial verification values ($2 \times MPE$).*

---

## 3. ERROR CALCULATIONS

### 3.1 Uncorrected Error ($E$)
The uncorrected error $E$ is the difference between the indicated value $I$ and the true applied load value $L$:
$$E = I - L$$

### 3.2 Corrected Error ($E_c$) — Changeover Point Method
Per Clause A.4.4.3, when the instrument scale interval $d$ is not sufficiently small ($d > 0.2e$), the changeover point method is used to eliminate rounding error.

Small fractional weights $\Delta L$ (equal to $0.1e$) are added incrementally to the load receptor until the indication increases by one scale interval ($I + d$).

The true indicated value $I_0$ prior to rounding is given by:
$$I_0 = I + \frac{1}{2}e - \Delta L$$

The **Corrected Error $E_c$** is computed as:
$$E_c = I_0 - L = I + \frac{1}{2}e - \Delta L - L$$

Where:
- $I$: Indicated value on the instrument display before adding changeover weights.
- $e$: Verification scale interval.
- $\Delta L$: Additional mass required to cause indication change from $I$ to $I + d$.
- $L$: Total standard test mass applied to the load receptor.

---

## 4. SPECIFIC OIML R-76 TEST PROCEDURES

### 4.1 Weighing Performance Test (Clause A.4.4)
- **Procedure:** Test masses are applied from zero up to $Max$ in at least 5 step increments, and back down to zero.
- **Evaluation:** At each load point $L_i$, compute $E_{c,i}$.
- **Compliance:** Verified if $|E_{c,i}| \le |MPE(L_i)|$ for all increasing and decreasing steps.

### 4.2 Tare Balancing Test (Clause A.4.8)
- **Procedure:** A tare load $T$ is applied and balanced. Additional test loads $L_{net}$ are applied to verify net weighing accuracy.
- **Evaluation:** $E_c = I_{net} + \frac{1}{2}e - \Delta L - L_{net}$.
- **Compliance:** Verified if $|E_c| \le |MPE(L_{net})|$.

### 4.3 Linearity and Hysteresis Test
- **Procedure:** Compare errors between increasing load sequence $E_{c,inc}$ and decreasing load sequence $E_{c,dec}$ at identical test loads.
- **Hysteresis Error:** $H = |E_{c,dec} - E_{c,inc}|$.
- **Compliance:** Verified if $H \le |MPE(L)|$.

### 4.4 Repeatability Test (Clause A.4.10 / Clause 3.6.1)
- **Procedure:** A single load (approximately $0.5 Max$ or $0.8 Max$) is applied $n$ times (typically 3 to 10 repetitions) under identical conditions.
- **Evaluation:** Calculate corrected error $E_{c,k}$ for each repetition $k$.
- **Range:** $R = \max(E_{c,k}) - \min(E_{c,k})$.
- **Compliance:** Verified if $R \le |MPE(L)|$.

### 4.5 Eccentricity / Corner Load Test (Clause A.4.7 / Clause 3.6.2)
- **Procedure:** A load equal to approximately $\frac{1}{3} Max$ (or $\frac{1}{4} Max$ for instruments with 4 or more support points) is placed sequentially at different off-center positions on the load receptor (Center, Front-Left, Front-Right, Back-Left, Back-Right).
- **Evaluation:** Calculate $E_{c,pos}$ for each corner position.
- **Compliance:** Verified if $|E_{c,pos}| \le |MPE(\frac{1}{3} Max)|$ for every position.

---

## 5. AGGREGATE COMPLIANCE VERDICT

The overall evaluation verdict is determined as follows:
$$\text{Overall Verdict} = \begin{cases} \mathbf{PASS}, & \text{if } |E_{c,i}| \le |MPE(L_i)| \text{ for ALL test procedures and load points} \\ \mathbf{FAIL}, & \text{if ANY single test point exceeds } |MPE| \end{cases}$$

---

## 6. RULE VERSIONING ARCHITECTURE

To support future revisions of OIML recommendations without requiring application code changes:
1. Rule specifications are stored in the `rule_versions` table (e.g., `code="OIML_R76_2006"`).
2. Tolerance boundary values and MPE formulas are stored in `rule_limits` linked to `rule_version_id`.
3. Test sessions reference `rule_version_id`, binding the evaluation session to the precise legal metrology rule version selected during session setup.
