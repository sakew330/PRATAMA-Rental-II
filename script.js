// ===== EDIT DI SINI =====
const WA_NUMBER = "6281234567890"; // nomor WA admin, format 62xxx tanpa +
const CARS = [
  { id: "agya", gambar: "img/agya.jpg",     nama: "Toyota Agya",     tipe: "City car", kursi: 4, trans: "Manual", harga: 300000 },
  { id: "avanza", gambar: "img/avanza.jpg",   nama: "Toyota Avanza",   tipe: "MPV",      kursi: 7, trans: "Matic",  harga: 400000 },
  { id: "innova", gambar: "img/innova.jpg",   nama: "Toyota Innova",   tipe: "MPV",      kursi: 7, trans: "Matic",  harga: 600000 },
  { id: "fortuner", gambar: "img/fortuner.jpg", nama: "Toyota Fortuner", tipe: "SUV",      kursi: 7, trans: "Matic",  harga: 1000000 }
];
// gambar: taruh foto di folder img/ (nama file sesuai di bawah) atau pakai link URL.
// Kalau foto belum ada, otomatis tampil ilustrasi mobil.
// ========================

const $ = (id) => document.getElementById(id);
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const carById = (id) => CARS.find((c) => c.id === id);
const lamaHari = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5) + 1;

let bookings = [];
try { bookings = JSON.parse(localStorage.getItem("bookings") || "[]"); } catch (e) { bookings = []; }
const save = () => { try { localStorage.setItem("bookings", JSON.stringify(bookings)); } catch (e) {} };

const carSvg = '<svg width="90" height="44" viewBox="0 0 90 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 30v-8l10-3 10-11h30l12 11 10 3v8"/><path d="M4 30h82"/><circle cx="24" cy="32" r="6" fill="#E3DED2"/><circle cx="66" cy="32" r="6" fill="#E3DED2"/></svg>';

function renderCars() {
  $("carGrid").innerHTML = CARS.map((c) => `
    <article class="car">
      <div class="img">${carSvg}${c.gambar ? `<img src="${esc(c.gambar)}" alt="${esc(c.nama)}" loading="lazy" onerror="this.remove()">` : ""}</div>
      <div class="body">
        <h3>${esc(c.nama)}</h3>
        <small>${c.kursi} kursi · ${c.trans} · ${esc(c.tipe)}</small>
        <div class="row"><div><b>${rp(c.harga)}</b><small>/hari</small></div>
        <button class="btn dark" data-pilih="${c.id}">Sewa</button></div>
      </div>
    </article>`).join("");
  $("mobil").innerHTML = '<option value="">Pilih mobil</option>' + CARS.map((c) => `<option value="${c.id}">${esc(c.nama)} (${rp(c.harga)}/hari)</option>`).join("");
}

function hitung() {
  const c = carById($("mobil").value), a = $("mulai").value, b = $("selesai").value;
  if (!c || !a || !b || b < a) { $("summary").textContent = "Pilih mobil dan tanggal untuk lihat total."; return null; }
  const hari = lamaHari(a, b), total = hari * c.harga;
  $("summary").innerHTML = `${esc(c.nama)}<br>${hari} hari × ${rp(c.harga)}<br>Total <b>${rp(total)}</b>`;
  return { c, a, b, hari, total };
}

function bentrok(id, a, b) {
  return bookings.some((x) => x.car === id && x.status !== "Dibatalkan" && a <= x.selesai && b >= x.mulai);
}

function renderList() {
  if (!bookings.length) { $("list").innerHTML = '<p class="empty">Belum ada pesanan.</p>'; return; }
  $("list").innerHTML = bookings.slice().reverse().map((x) => `
    <div class="item">
      <div><span class="tag">${esc(x.status)}</span> <b>${esc(x.kode)}</b><br>
      ${esc(carById(x.car)?.nama || x.car)} · ${x.mulai} s/d ${x.selesai} (${x.hari} hari)<br>
      <small>${esc(x.nama)} · ${rp(x.total)}</small></div>
      <div class="acts">
        <a class="btn dark" target="_blank" rel="noopener" href="${waLink(x)}">Kirim WA</a>
        ${x.status !== "Dibatalkan" ? `<button class="btn ghost" data-batal="${x.kode}">Batalkan</button>` : ""}
      </div>
    </div>`).join("");
}

function waLink(x) {
  const t = `Halo, saya mau konfirmasi booking ${x.kode}\nNama: ${x.nama}\nMobil: ${carById(x.car)?.nama}\nTanggal: ${x.mulai} s/d ${x.selesai} (${x.hari} hari)\nTotal: ${rp(x.total)}\nLokasi antar: ${x.lokasi || "-"}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
}

document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-pilih]");
  if (p) { $("mobil").value = p.dataset.pilih; hitung(); $("booking").scrollIntoView(); }
  const b = e.target.closest("[data-batal]");
  if (b && confirm("Batalkan pesanan ini?")) {
    const x = bookings.find((i) => i.kode === b.dataset.batal);
    if (x) { x.status = "Dibatalkan"; save(); renderList(); }
  }
});
["mobil", "mulai", "selesai"].forEach((id) => $(id).addEventListener("change", hitung));

const today = new Date().toISOString().slice(0, 10);
$("mulai").min = $("selesai").min = today;

$("bookingForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = (m) => { $("err").textContent = m; };
  const nama = $("nama").value.trim(), hp = $("hp").value.trim();
  if (!nama) return err("Nama wajib diisi.");
  if (!/^(\+?62|0)8\d{7,12}$/.test(hp.replace(/[\s-]/g, ""))) return err("Nomor WhatsApp tidak valid.");
  if (!$("mobil").value) return err("Pilih mobilnya dulu.");
  if (!$("mulai").value || !$("selesai").value) return err("Isi tanggal mulai dan selesai.");
  if ($("selesai").value < $("mulai").value) return err("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  if ($("mulai").value < today) return err("Tanggal mulai tidak boleh di masa lalu.");
  const h = hitung();
  if (bentrok(h.c.id, h.a, h.b)) return err("Mobil ini sudah dibooking di tanggal tersebut. Coba tanggal lain.");
  err("");
  const x = { kode: "JLN-" + Date.now().toString(36).toUpperCase().slice(-5), nama, hp, car: h.c.id, mulai: h.a, selesai: h.b, hari: h.hari, total: h.total, lokasi: $("lokasi").value.trim(), status: "Menunggu" };
  bookings.push(x); save(); renderList();
  $("bookingForm").reset(); hitung();
  window.open(waLink(x), "_blank");
  $("pesanan").scrollIntoView();
});

renderCars(); renderList();

