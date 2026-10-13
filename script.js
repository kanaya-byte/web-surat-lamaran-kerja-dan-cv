(function () {
  "use strict";

  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var MAKS_SERTIF = 10;
  var $ = function (id) { return document.getElementById(id); };

  var ttdData = "";      // tanda tangan (data URL), kosong jika belum ada
  var fotoData = "";     // foto CV (data URL), kosong jika belum ada
  var sertif = [];       // sertifikat terupload: [{ nama, data, surat, cv }]
  var aktif = "surat";   // tab yang sedang tampil: "surat" atau "cv"

  // Isian berulang untuk CV
  var daftar = {
    pengalaman: [{ jabatan: "", perusahaan: "", periode: "", uraian: "" }],
    pendidikan: [{ institusi: "", jurusan: "", periode: "", nilai: "" }]
  };
  // [key, label, placeholder, jenis]
  var DEF = {
    pengalaman: {
      wadah: "listPengalaman",
      judul: "Pengalaman",
      kolom: [
        ["jabatan", "Jabatan", "Staf Administrasi", "input"],
        ["perusahaan", "Perusahaan", "CV Sinar Jaya", "input"],
        ["periode", "Periode", "Jan 2022 – Des 2023", "input"],
        ["uraian", "Tugas & pencapaian (satu per baris)", "Mengelola arsip dan laporan bulanan\nMenyusun jadwal rapat", "textarea"]
      ]
    },
    pendidikan: {
      wadah: "listPendidikan",
      judul: "Pendidikan",
      kolom: [
        ["institusi", "Sekolah / universitas", "Universitas Indonesia", "input"],
        ["jurusan", "Jurusan", "S1 Manajemen", "input"],
        ["periode", "Periode", "2018 – 2022", "input"],
        ["nilai", "IPK / nilai", "3,60 / 4,00", "input"]
      ]
    }
  };

  var fields = ["nama","kota","telepon","email","alamat","posisi","perusahaan","penerima","sumber",
                "pendidikan","pengalaman","pengalamanDetail","keahlian","gaya","lampiran",
                "ttl","linkedin","ringkasan","sertifikat"];

  /* ================= Utilitas ================= */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }
  function tanggalHariIni() {
    var d = new Date();
    return d.getDate() + " " + BULAN[d.getMonth()] + " " + d.getFullYear();
  }
  function daftarKeahlian(teks) {
    var arr = teks.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(", ") + " dan " + arr[arr.length - 1];
  }
  function ambilData() {
    var v = {};
    fields.forEach(function (f) { v[f] = $(f).value.trim(); });
    return v;
  }
  function baris(teks) {
    return teks.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function ulHtml(arr, cls) {
    if (!arr.length) return "";
    return '<ul class="' + cls + '">' + arr.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>";
  }
  function status(msg) {
    $("status").textContent = msg;
    setTimeout(function () { $("status").textContent = ""; }, 3500);
  }
  function namaSertif(s, i) {
    return s.nama.trim() || ("Sertifikat " + (i + 1));
  }
  // Sertifikat yang dicentang untuk surat / untuk CV
  function sertifSurat() { return sertif.filter(function (s) { return s.surat; }); }
  function sertifCv() { return sertif.filter(function (s) { return s.cv; }); }
  function sertifSemua() { return sertif.filter(function (s) { return s.surat || s.cv; }); }

  /* ================= Surat lamaran ================= */
  // Setiap blok punya versi teks polos (t) untuk disalin dan versi HTML (h) untuk pratinjau.
  // Kolom yang kosong diganti penanda [ ... ] supaya pengguna tahu apa yang belum diisi.
  function bangunSurat(v) {
    var P = function (val, label) {
      return val ? { t: val, h: esc(val) }
                 : { t: "[" + label + "]", h: '<span class="placeholder">[' + esc(label) + ']</span>' };
    };
    var nama = P(v.nama, "Nama Anda");
    var kota = P(v.kota, "Kota");
    var posisi = P(v.posisi, "Posisi");
    var perusahaan = P(v.perusahaan, "Nama Perusahaan");
    var pendidikan = P(v.pendidikan, "Pendidikan terakhir");
    var penerima = v.penerima || "Bapak/Ibu HRD";
    var formal = v.gaya === "formal";
    var blok = [];
    var add = function (t, h, cls) { blok.push({ t: t, h: h, cls: cls || "" }); };

    add(kota.t + ", " + tanggalHariIni(), kota.h + ", " + esc(tanggalHariIni()), "right");

    add("Yth. " + penerima + "\n" + perusahaan.t + "\ndi tempat",
        "Yth. " + esc(penerima) + "<br>" + perusahaan.h + "<br>di tempat");

    add("Perihal: Lamaran Pekerjaan sebagai " + posisi.t,
        "<strong>Perihal: Lamaran Pekerjaan sebagai " + posisi.h + "</strong>");

    add("Dengan hormat,", "Dengan hormat,");

    var sumber = v.sumber ? (formal ? " yang saya ketahui melalui " : " yang saya lihat di ") + v.sumber : "";
    var p1t = formal
      ? "Berdasarkan informasi lowongan" + sumber + ", dengan ini saya mengajukan lamaran untuk mengisi posisi " + posisi.t + " di " + perusahaan.t + "."
      : "Saya menulis untuk melamar posisi " + posisi.t + " di " + perusahaan.t + sumber + ".";
    var p1h = formal
      ? "Berdasarkan informasi lowongan" + esc(sumber) + ", dengan ini saya mengajukan lamaran untuk mengisi posisi " + posisi.h + " di " + perusahaan.h + "."
      : "Saya menulis untuk melamar posisi " + posisi.h + " di " + perusahaan.h + esc(sumber) + ".";
    add(p1t, p1h);

    add("Saya adalah lulusan " + pendidikan.t + ". Saya memiliki ketertarikan yang kuat pada bidang ini dan siap belajar serta berkontribusi di lingkungan kerja yang baru.",
        "Saya adalah lulusan " + pendidikan.h + ". Saya memiliki ketertarikan yang kuat pada bidang ini dan siap belajar serta berkontribusi di lingkungan kerja yang baru.");

    var peng = {
      "fresh": "Sebagai lulusan baru, saya memiliki semangat belajar yang tinggi, mudah beradaptasi, dan terbiasa bekerja dalam tim melalui kegiatan perkuliahan dan organisasi.",
      "magang": "Saya telah memiliki pengalaman magang atau pekerjaan lepas yang melatih tanggung jawab, ketelitian, dan kemampuan bekerja sesuai tenggat waktu.",
      "1-3": "Saya memiliki pengalaman kerja selama 1–3 tahun yang membentuk kemampuan saya dalam menyelesaikan tugas secara mandiri maupun bersama tim.",
      "3+": "Saya memiliki pengalaman kerja lebih dari tiga tahun yang membekali saya dengan kemampuan menyelesaikan masalah dan bekerja secara efektif di bawah tekanan."
    }[v.pengalaman];
    if (v.pengalamanDetail) peng += " Di antaranya: " + v.pengalamanDetail.replace(/[.\s]+$/, "") + ".";
    add(peng, esc(peng));

    var kh = daftarKeahlian(v.keahlian);
    if (kh) {
      add("Keahlian utama yang saya miliki mencakup " + kh + ". Saya yakin kemampuan tersebut dapat mendukung kebutuhan " + perusahaan.t + ".",
          "Keahlian utama yang saya miliki mencakup " + esc(kh) + ". Saya yakin kemampuan tersebut dapat mendukung kebutuhan " + perusahaan.h + ".");
    }

    // Lampiran: daftar manual + sertifikat yang dicentang untuk surat
    var lamp = baris(v.lampiran).concat(sertifSurat().map(function (s) {
      return "Sertifikat: " + namaSertif(s, sertif.indexOf(s));
    }));
    if (lamp.length) {
      add("Sebagai bahan pertimbangan, saya lampirkan:\n" + lamp.map(function (l, i) { return (i + 1) + ". " + l; }).join("\n"),
          'Sebagai bahan pertimbangan, saya lampirkan:<ul class="docs">' + lamp.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>");
    }

    var penutup = formal
      ? "Besar harapan saya untuk dapat diberi kesempatan mengikuti proses seleksi lebih lanjut. Atas perhatian dan kesempatan yang Bapak/Ibu berikan, saya ucapkan terima kasih."
      : "Saya berharap dapat berdiskusi lebih lanjut mengenai kontribusi yang bisa saya berikan. Terima kasih atas waktu dan pertimbangan Bapak/Ibu.";
    add(penutup, esc(penutup));

    add("Hormat saya,", "Hormat saya,");

    // Tanda tangan + nama + kontak
    var kontak = [v.telepon, v.email, v.alamat].filter(Boolean);
    var ttdHtml = ttdData
      ? '<img class="ttd" src="' + ttdData + '" alt="Tanda tangan">'
      : "<br><br>"; // ruang kosong untuk tanda tangan basah jika dicetak
    add(nama.t + (kontak.length ? "\n" + kontak.join(" | ") : ""),
        ttdHtml + "<strong>" + nama.h + "</strong>" + (kontak.length ? "<br>" + kontak.map(esc).join(" | ") : ""));

    return blok;
  }

  var teksTerakhir = "";
  function renderSurat() {
    var blok = bangunSurat(ambilData());
    $("surat").innerHTML = blok.map(function (b) {
      return "<p" + (b.cls ? ' class="' + b.cls + '"' : "") + ">" + b.h + "</p>";
    }).join("");
    teksTerakhir = blok.map(function (b) { return b.t; }).join("\n\n");
  }

  /* ================= Halaman lampiran sertifikat ================= */
  function halamanLampiran(list) {
    return list.map(function (s, n) {
      var nm = namaSertif(s, sertif.indexOf(s));
      return '<div class="paper lampiran-page"><h3>Lampiran ' + (n + 1) + ": " + esc(nm) + "</h3>" +
        '<img src="' + s.data + '" alt="' + esc(nm) + '"></div>';
    }).join("");
  }
  function renderLampiran() {
    $("lampiranSurat").innerHTML = halamanLampiran(sertifSurat());
    $("lampiranCv").innerHTML = halamanLampiran(sertifCv());
    $("lampiranSemua").innerHTML = halamanLampiran(sertifSemua());
  }

  /* ================= CV ================= */
  function adaIsi(item) {
    return Object.keys(item).some(function (k) { return item[k].trim(); });
  }

  function renderCV() {
    var v = ambilData();

    // Kepala CV: nama, posisi, kontak, foto
    var nama = v.nama ? esc(v.nama) : '<span class="placeholder">[Nama Anda]</span>';
    var kontak = [];
    if (v.ttl) kontak.push("Lahir: " + v.ttl);
    if (v.telepon) kontak.push(v.telepon);
    if (v.email) kontak.push(v.email);
    if (v.linkedin) kontak.push(v.linkedin);
    if (v.alamat) kontak.push(v.alamat);

    var html = '<header class="cv-head"><div><h2>' + nama + "</h2>" +
      (v.posisi ? '<p class="cv-posisi">' + esc(v.posisi) + "</p>" : "") +
      ulHtml(kontak, "cv-kontak") + "</div>" +
      (fotoData ? '<img class="cv-foto" src="' + fotoData + '" alt="Foto">' : "") +
      "</header>";

    var sec = function (judul, isi) {
      return isi ? '<section class="cv-sec"><h3>' + judul + "</h3>" + isi + "</section>" : "";
    };
    var isiCV = "";

    // Ringkasan profil
    isiCV += sec("Ringkasan profil",
      v.ringkasan ? "<p>" + esc(v.ringkasan).replace(/\n/g, "<br>") + "</p>" : "");

    // Pengalaman kerja
    isiCV += sec("Pengalaman kerja", daftar.pengalaman.filter(adaIsi).map(function (it) {
      return '<div class="cv-item"><div class="cv-row"><span>' + esc(it.jabatan) + '</span><span class="cv-periode">' + esc(it.periode) + "</span></div>" +
        (it.perusahaan ? '<div class="cv-sub">' + esc(it.perusahaan) + "</div>" : "") +
        ulHtml(baris(it.uraian), "cv-list") + "</div>";
    }).join(""));

    // Pendidikan
    isiCV += sec("Pendidikan", daftar.pendidikan.filter(adaIsi).map(function (it) {
      return '<div class="cv-item"><div class="cv-row"><span>' + esc(it.institusi) + '</span><span class="cv-periode">' + esc(it.periode) + "</span></div>" +
        (it.jurusan ? '<div class="cv-sub">' + esc(it.jurusan) + "</div>" : "") +
        (it.nilai ? '<div class="cv-sub">IPK/Nilai: ' + esc(it.nilai) + "</div>" : "") + "</div>";
    }).join(""));

    // Keahlian (dari kolom keahlian yang sama dengan surat)
    var keahlian = v.keahlian.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    isiCV += sec("Keahlian", ulHtml(keahlian, "cv-chips"));

    // Sertifikat & organisasi: isian manual + sertifikat yang dicentang untuk CV
    var daftarSertif = baris(v.sertifikat).concat(sertifCv().map(function (s) {
      return namaSertif(s, sertif.indexOf(s)) + " (terlampir)";
    }));
    isiCV += sec("Sertifikat &amp; organisasi", ulHtml(daftarSertif, "cv-list"));

    if (!isiCV) {
      isiCV = '<p class="kosong">Isi bagian "Data untuk CV" di formulir. CV akan tersusun otomatis di sini.</p>';
    }
    $("cv").innerHTML = html + isiCV;
  }

  function render() {
    renderSurat();
    renderCV();
    renderLampiran();
  }

  /* ================= Isian berulang (pengalaman, pendidikan) ================= */
  function renderDaftar(nama) {
    var d = DEF[nama];
    var html = "";
    daftar[nama].forEach(function (it, i) {
      html += '<div class="item"><div class="item-head"><strong>' + d.judul + " " + (i + 1) + "</strong>" +
        '<button type="button" class="link-btn" data-aksi="hapus" data-idx="' + i + '">Hapus</button></div>';
      d.kolom.forEach(function (k) {
        var id = nama + "-" + i + "-" + k[0];
        var attr = ' id="' + id + '" data-idx="' + i + '" data-key="' + k[0] + '" placeholder="' + esc(k[2]) + '"';
        html += '<label for="' + id + '">' + esc(k[1]) + "</label>";
        html += k[3] === "textarea"
          ? "<textarea" + attr + ">" + esc(it[k[0]]) + "</textarea>"
          : "<input" + attr + ' value="' + esc(it[k[0]]) + '">';
      });
      html += "</div>";
    });
    $(d.wadah).innerHTML = html;
  }

  function tambahItem(nama) {
    var kosong = {};
    DEF[nama].kolom.forEach(function (k) { kosong[k[0]] = ""; });
    daftar[nama].push(kosong);
    renderDaftar(nama);
    renderCV();
  }

  Object.keys(DEF).forEach(function (nama) {
    var wadah = $(DEF[nama].wadah);
    wadah.addEventListener("input", function (e) {
      var t = e.target;
      if (!t.dataset.key) return;
      daftar[nama][Number(t.dataset.idx)][t.dataset.key] = t.value;
      renderCV();
    });
    wadah.addEventListener("click", function (e) {
      var t = e.target;
      if (t.dataset.aksi !== "hapus") return;
      daftar[nama].splice(Number(t.dataset.idx), 1);
      renderDaftar(nama);
      renderCV();
    });
    renderDaftar(nama);
  });
  $("btnTambahPengalaman").addEventListener("click", function () { tambahItem("pengalaman"); });
  $("btnTambahPendidikan").addEventListener("click", function () { tambahItem("pendidikan"); });

  /* ================= Upload sertifikat ================= */
  function renderListSertif() {
    $("listSertif").innerHTML = sertif.map(function (s, i) {
      var id = "sertif-" + i;
      return '<div class="item"><div class="item-head"><strong>Sertifikat ' + (i + 1) + "</strong>" +
        '<button type="button" class="link-btn" data-aksi="hapus" data-idx="' + i + '">Hapus</button></div>' +
        '<img class="thumb" src="' + s.data + '" alt="Pratinjau sertifikat ' + (i + 1) + '">' +
        '<label for="' + id + '">Nama sertifikat</label>' +
        '<input id="' + id + '" data-idx="' + i + '" data-key="nama" value="' + esc(s.nama) + '" placeholder="Contoh: Microsoft Office Specialist">' +
        '<label class="cek"><input type="checkbox" data-idx="' + i + '" data-key="surat"' + (s.surat ? " checked" : "") + '> Lampirkan di surat</label>' +
        '<label class="cek"><input type="checkbox" data-idx="' + i + '" data-key="cv"' + (s.cv ? " checked" : "") + '> Lampirkan di CV</label>' +
        "</div>";
    }).join("");
  }

  // Kecilkan gambar (maks 1600 px) dan beri latar putih supaya ringan dan rapi saat dicetak
  function kecilkanGambar(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var skala = Math.min(1, 1600 / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * skala);
          c.height = Math.round(img.height * skala);
          var x = c.getContext("2d");
          x.fillStyle = "#fff";
          x.fillRect(0, 0, c.width, c.height);
          x.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  $("sertifFile").addEventListener("change", function () {
    var files = Array.prototype.slice.call(this.files);
    this.value = ""; // supaya file yang sama bisa dipilih lagi
    var rantai = Promise.resolve();
    files.forEach(function (file) {
      rantai = rantai.then(function () {
        if (file.type.indexOf("image/") !== 0) {
          status("\"" + file.name + "\" dilewati. Hanya gambar JPG atau PNG yang didukung.");
          return;
        }
        if (sertif.length >= MAKS_SERTIF) {
          status("Maksimal " + MAKS_SERTIF + " sertifikat.");
          return;
        }
        return kecilkanGambar(file).then(function (data) {
          sertif.push({
            nama: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
            data: data,
            surat: true,
            cv: true
          });
        }).catch(function () {
          status("Gagal membaca \"" + file.name + "\".");
        });
      });
    });
    rantai.then(function () {
      renderListSertif();
      render();
    });
  });

  // Ketik nama sertifikat
  $("listSertif").addEventListener("input", function (e) {
    var t = e.target;
    if (t.dataset.key !== "nama") return;
    sertif[Number(t.dataset.idx)].nama = t.value;
    render();
  });
  // Centang surat / CV
  $("listSertif").addEventListener("change", function (e) {
    var t = e.target;
    if (t.type !== "checkbox") return;
    sertif[Number(t.dataset.idx)][t.dataset.key] = t.checked;
    render();
  });
  // Hapus sertifikat
  $("listSertif").addEventListener("click", function (e) {
    var t = e.target;
    if (t.dataset.aksi !== "hapus") return;
    sertif.splice(Number(t.dataset.idx), 1);
    renderListSertif();
    render();
  });

  /* ================= Tab surat / CV ================= */
  function pilihTab(nama) {
    aktif = nama;
    $("surat").hidden = nama !== "surat";
    $("lampiranSurat").hidden = nama !== "surat";
    $("cv").hidden = nama !== "cv";
    $("lampiranCv").hidden = nama !== "cv";
    $("tabSurat").setAttribute("aria-selected", String(nama === "surat"));
    $("tabCv").setAttribute("aria-selected", String(nama === "cv"));
  }
  $("tabSurat").addEventListener("click", function () { pilihTab("surat"); });
  $("tabCv").addEventListener("click", function () { pilihTab("cv"); });

  /* ================= Cetak & salin ================= */
  $("btnCetak").addEventListener("click", function () { window.print(); });

  $("btnCetakSemua").addEventListener("click", function () {
    document.body.classList.add("print-all");
    window.print();
  });
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("print-all");
  });

  $("btnSalin").addEventListener("click", function () {
    var teks = aktif === "surat" ? teksTerakhir : $("cv").innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(
        function () { status("Teks tersalin."); },
        function () { status("Gagal menyalin. Pilih teks lalu salin manual."); }
      );
    } else {
      status("Browser tidak mendukung salin otomatis.");
    }
  });

  /* ================= Tanda tangan ================= */
  var canvas = $("ttdCanvas");
  var ctx = canvas.getContext("2d");
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#10264a";
  var menggambar = false;

  function posisi(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * canvas.width / r.width,
      y: (e.clientY - r.top) * canvas.height / r.height
    };
  }
  canvas.addEventListener("pointerdown", function (e) {
    menggambar = true;
    canvas.setPointerCapture(e.pointerId);
    var p = posisi(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1); // titik kecil agar sekali ketuk tetap terlihat
    ctx.stroke();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!menggambar) return;
    var p = posisi(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  function selesaiGambar() {
    if (!menggambar) return;
    menggambar = false;
    ttdData = canvas.toDataURL("image/png"); // latar transparan, menyatu dengan kertas
    renderSurat();
  }
  canvas.addEventListener("pointerup", selesaiGambar);
  canvas.addEventListener("pointercancel", selesaiGambar);

  $("btnHapusTtd").addEventListener("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    $("ttdFile").value = "";
    ttdData = "";
    renderSurat();
  });

  $("ttdFile").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var skala = Math.min(1, 600 / img.width); // kecilkan dulu supaya ringan
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * skala);
        c.height = Math.round(img.height * skala);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ttdData = c.toDataURL("image/png");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderSurat();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  /* ================= Foto CV ================= */
  $("fotoFile").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        // potong tengah gambar ke rasio 3:4 (300 x 400 px)
        var rasio = 3 / 4;
        var sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (sw / sh > rasio) {
          var nw = sh * rasio;
          sx = (sw - nw) / 2;
          sw = nw;
        } else {
          var nh = sw / rasio;
          sy = (sh - nh) / 2;
          sh = nh;
        }
        var c = document.createElement("canvas");
        c.width = 300;
        c.height = 400;
        c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, 300, 400);
        fotoData = c.toDataURL("image/jpeg", 0.9);
        renderCV();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  $("btnHapusFoto").addEventListener("click", function () {
    $("fotoFile").value = "";
    fotoData = "";
    renderCV();
  });

  /* ================= Mulai ================= */
  fields.forEach(function (f) { $(f).addEventListener("input", render); });
  render();
})();