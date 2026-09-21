const $ = (value) => document.querySelector(value);
let config;
const atomic = 1_000_000_000_000n;
const testnet = new URLSearchParams(window.location.search).get("mode") !== "live";
const receiptApi = testnet ? "/api/xmr/testnet/receipts" : "/api/xmr/receipts";

function xmr(value) { const number = BigInt(value); const whole = number / atomic; const decimals = (number % atomic).toString().padStart(12, "0").replace(/0+$/, ""); return decimals ? `${whole}.${decimals}` : whole.toString(); }
function quote(value) { const source = String(value).trim(); if (!/^\d+(?:\.\d{0,12})?$/.test(source)) throw new Error("Enter an XMR amount with up to 12 decimals."); const [whole, fraction = ""] = source.split("."); return BigInt(whole) * atomic + BigInt((fraction + "000000000000").slice(0, 12)); }
function short(value, left = 9, right = 7) { return value.length > left + right ? `${value.slice(0, left)}…${value.slice(-right)}` : value; }
function updateEstimate() { try { const burned = quote($("#amount").value); if (burned < BigInt(config.minBurnAtomic)) throw new Error(`Minimum is ${xmr(config.minBurnAtomic)} XMR.`); const amount = burned * BigInt(config.rate) / atomic; $("#estimate").textContent = `${amount.toLocaleString()} ${config.futureToken.symbol}`; $("#calc-status").textContent = "Preview only — no transaction is created."; } catch (error) { $("#estimate").textContent = "—"; $("#calc-status").textContent = error.message; } }
function showConfig() { const live = testnet || config.launchReady; const staging = testnet || config.network === "stagenet"; $("#network-pill").textContent = testnet ? "XMR MODE" : live ? (staging ? "STAGENET READY" : "MAINNET READY") : "REVIEW MODE"; $("#network-pill").classList.toggle("live", live); $("#launch-notice").innerHTML = testnet ? "<strong>Verify wallet transactions before sending funds.</strong> Create receipts and test the complete flow. This endpoint does not broadcast or custody XMR." : live ? (staging ? "<strong>Stagenet testing enabled.</strong> Test coins only. This is not a mainnet burn or token claim." : "<strong>Live verification enabled.</strong> Review every transaction in your own wallet before broadcasting.") : `<strong>Live launch setup is incomplete.</strong> ${config.blockers.join(" ")}`; $("#footer-state").textContent = testnet ? "XMR receipt flow: active" : live ? (staging ? "Safety gate: stagenet" : "Safety gate: active") : "Safety gate: setup incomplete";
  const values = [config.network, `1 XMR = ${config.rate} ${config.futureToken.symbol}`, `${xmr(config.minBurnAtomic)} XMR`, `${config.minConfirmations} blocks`, config.futureToken.reference ? `${config.futureToken.symbol} · ${short(config.futureToken.reference)}` : `${config.futureToken.symbol} · mint pending`];
  [...$("#constants").querySelectorAll("dd")].forEach((node, index) => { node.textContent = values[index]; }); $("#submit").disabled = !live; if (!live) $("#form-status").textContent = "Submissions unlock only after the production safety gate is complete."; if (testnet) { $("#submit").textContent = "Create simulated receipt"; $("#receipt-form").querySelector("label:nth-child(2)").firstChild.textContent = "Test proof"; } updateEstimate(); }
async function loadLedger() { const response = await fetch(receiptApi, { cache: "no-store" }); const data = await response.json(); const rows = data.receipts || []; $("#ledger-status").textContent = rows.length ? `${rows.length} ${testnet ? "practice " : ""}receipt${rows.length === 1 ? "" : "s"}.` : `No ${testnet ? "practice " : ""}receipts yet.`; $("#ledger-body").replaceChildren(...rows.map((item) => { const row = document.createElement("tr"); [short(item.txid), `${xmr(item.burnAtomic)} XMR`, `${Number(item.amount).toLocaleString()} ${config.futureToken.symbol}`, short(item.recipient), new Date(item.acceptedAt).toLocaleString()].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }); return row; })); }
async function submit(event) { event.preventDefault(); if (!testnet && !config.launchReady) return; const form = Object.fromEntries(new FormData(event.currentTarget)); const status = $("#form-status"); const button = $("#submit"); button.disabled = true; status.textContent = testnet ? "Creating receipt…" : "Verifying payment proof…"; try { if (testnet) form.burnAtomic = quote($("#amount").value).toString(); const response = await fetch(receiptApi, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Verification failed."); event.currentTarget.reset(); status.textContent = `Receipt accepted: ${short(body.receipt.txid)}.`; await loadLedger(); } catch (error) { status.textContent = error.message; } finally { button.disabled = !(testnet || config.launchReady); } }

async function initialize() {
  try {
    const response = await fetch("/api/xmr/config", { cache: "no-store" });
    if (!response.ok) throw new Error("config unavailable");
    config = await response.json();
    showConfig();
  } catch {
    $("#launch-notice").textContent = "Unable to load launch configuration.";
    return;
  }

  try {
    await loadLedger();
  } catch {
    $("#ledger-status").textContent = "Unable to load the receipt ledger.";
  }
}
$("#amount").addEventListener("input", updateEstimate); $("#receipt-form").addEventListener("submit", submit); $("#refresh").addEventListener("click", loadLedger); initialize();
