import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FileText,
  LogIn,
  LogOut,
  Menu,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Shirt,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { supabase } from "./supabase";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

function cleanPhone(value = "") {
  return value.replace(/[^\d+]/g, "").trim();
}

function whatsappNumber(value = "") {
  let number = cleanPhone(value).replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = `62${number.slice(1)}`;
  }

  return number;
}

function publicParticipantUrl(id) {
  return `${window.location.origin}/p/${id}`;
}

async function makeQrDataUrl(participant) {
  return QRCode.toDataURL(publicParticipantUrl(participant.id), {
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRpcRow(data) {
  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
}

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const protectedArea =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/scan");

  async function logout() {
    await supabase.auth.signOut();
    setMenu(false);
    navigate("/login");
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link
          className="brand"
          to={session ? "/admin" : "/login"}
          onClick={() => setMenu(false)}
        >
          <span className="brand-mark">
            <QrCode size={21} />
          </span>

          <span>Event Check-in</span>
        </Link>

        {session && protectedArea && (
          <>
            <button
              className="menu-btn"
              onClick={() => setMenu((value) => !value)}
              aria-label="Menu"
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>

            <nav className={`nav ${menu ? "open" : ""}`}>
              <Link to="/admin" onClick={() => setMenu(false)}>
                <BarChart3 size={17} />
                Dashboard
              </Link>

              <Link
                to="/admin/participants"
                onClick={() => setMenu(false)}
              >
                <Users size={17} />
                Peserta
              </Link>

              <Link to="/admin/attendees" onClick={() => setMenu(false)}>
                <CheckCircle2 size={17} />
                Hadir
              </Link>

              <Link to="/scan" onClick={() => setMenu(false)}>
                <QrCode size={17} />
                Scan QR
              </Link>

              <Link to="/admin/settings" onClick={() => setMenu(false)}>
                <Settings size={17} />
                Pengaturan
              </Link>

              <button className="nav-logout" onClick={logout}>
                <LogOut size={17} />
                Keluar
              </button>
            </nav>
          </>
        )}
      </header>

      {protectedArea && !session ? (
        <Navigate to="/login" replace />
      ) : (
        children
      )}
    </div>
  );
}

function Landing() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="landing-page">
      <section className="landing-card">
        <div className="hero-icon">
          <QrCode size={30} />
        </div>

        <p className="eyebrow">EVENT MANAGEMENT</p>

        <h1>Event Check-in</h1>

        <p className="muted">
          Kelola data peserta, e-ticket, dan kehadiran dari satu tempat.
        </p>

        <div className="landing-features">
          <div>
            <Users size={19} />
            <span>Kelola peserta</span>
          </div>

          <div>
            <QrCode size={19} />
            <span>QR e-ticket</span>
          </div>

          <div>
            <CheckCircle2 size={19} />
            <span>Check-in cepat</span>
          </div>
        </div>

        <Link className="btn primary full" to="/login">
          <LogIn size={18} />
          Login Admin
        </Link>
      </section>
    </main>
  );
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("superadmin@mail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setLoading(false);

    if (authError) {
      setError("Email atau password salah.");
      return;
    }

    navigate("/admin");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="hero-icon">
          <LogIn size={27} />
        </div>

        <p className="eyebrow">ADMIN AREA</p>

        <h1>Login admin</h1>

        <p className="muted">
          Masuk untuk mengelola peserta dan check-in.
        </p>

        {error && (
          <div className="alert error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="btn primary full"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminShell({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <main className="admin-page">{children}</main>;
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>

        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showLoading = false) {
    if (showLoading) {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from("participants")
      .select(
        "id,name,shirt_size,whatsapp,checked_in_at,created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setRows(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;

    const hadir = rows.filter(
      (row) => Boolean(row.checked_in_at)
    ).length;

    const sizes = {};

    DEFAULT_SIZES.forEach((size) => {
      sizes[size] = 0;
    });

    rows.forEach((row) => {
      if (sizes[row.shirt_size] !== undefined) {
        sizes[row.shirt_size] += 1;
      }
    });

    return {
      total,
      hadir,
      belum: total - hadir,
      pct: total
        ? Math.round((hadir / total) * 100)
        : 0,
      sizes,
    };
  }, [rows]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Pantau pendaftaran dan kehadiran peserta.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="btn secondary"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />
            Refresh
          </button>

          <Link className="btn primary" to="/scan">
            <QrCode size={18} />
            Scan QR
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Users size={20} />}
          label="Total peserta"
          value={stats.total}
        />

        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Sudah hadir"
          value={stats.hadir}
        />

        <StatCard
          icon={<ClipboardList size={20} />}
          label="Belum hadir"
          value={stats.belum}
        />

        <StatCard
          icon={<BarChart3 size={20} />}
          label="Kehadiran"
          value={`${stats.pct}%`}
        />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Distribusi ukuran baju</h2>
          <Shirt size={19} />
        </div>

        <div className="size-list">
          {DEFAULT_SIZES.map((size) => {
            const count = stats.sizes[size] || 0;

            const width = stats.total
              ? Math.round((count / stats.total) * 100)
              : 0;

            return (
              <div className="size-row" key={size}>
                <strong>{size}</strong>

                <div className="bar">
                  <i style={{ width: `${width}%` }} />
                </div>

                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Pendaftaran terbaru</h2>

          <Link to="/admin/participants">
            Lihat semua
          </Link>
        </div>

        <ParticipantTable
          rows={rows.slice(0, 8)}
          compact
        />
      </section>
    </div>
  );
}

function ParticipantTable({
  rows,
  compact = false,
  showActions = false,
}) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const filtered = rows.filter((row) =>
    row.name
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div>
      {!compact && (
        <div className="search-box">
          <Search size={17} />

          <input
            placeholder="Cari nama peserta..."
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Ukuran</th>
              {!compact && <th>WhatsApp</th>}
              <th>Status</th>
              <th>Waktu</th>
              {showActions && <th>Aksi</th>}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    showActions
                      ? compact
                        ? 5
                        : 6
                      : compact
                        ? 4
                        : 5
                  }
                  className="empty"
                >
                  Belum ada data.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>

                  <td>
                    <span className="pill neutral">
                      {row.shirt_size}
                    </span>
                  </td>

                  {!compact && (
                    <td>
                      {row.whatsapp || "-"}
                    </td>
                  )}

                  <td>
                    {row.checked_in_at ? (
                      <span className="pill success">
                        Hadir
                      </span>
                    ) : (
                      <span className="pill pending">
                        Belum hadir
                      </span>
                    )}
                  </td>

                  <td>
                    {formatDate(row.created_at)}
                  </td>

                  {showActions && (
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-btn"
                          title="Edit peserta"
                          onClick={() =>
                            navigate(
                              `/admin/participants/${row.id}/edit`
                            )
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <Link
                          className="icon-btn"
                          title="Buka e-ticket"
                          to={`/p/${row.id}`}
                          target="_blank"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Participants({
  onlyAttendees = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showLoading = false) {
    if (showLoading) {
      setRefreshing(true);
    }

    let query = supabase
      .from("participants")
      .select(
        "id,name,shirt_size,whatsapp,checked_in_at,created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (onlyAttendees) {
      query = query.not(
        "checked_in_at",
        "is",
        null
      );
    }

    const { data, error } = await query;

    if (!error) {
      setRows(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [onlyAttendees]);

  function exportCsv() {
    const header = [
      "Nama",
      "WhatsApp",
      "Ukuran Baju",
      "Status",
      "Waktu Daftar",
      "Waktu Check-in",
    ];

    const data = rows.map((row) => [
      row.name,
      row.whatsapp || "",
      row.shirt_size,
      row.checked_in_at
        ? "Hadir"
        : "Belum hadir",
      formatDate(row.created_at),
      formatDate(row.checked_in_at),
    ]);

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      header,
      ...data,
    ]
      .map((line) =>
        line.map(escapeCsv).join(",")
      )
      .join("\n");

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = onlyAttendees
      ? "peserta-hadir.csv"
      : "seluruh-peserta.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            DATA PESERTA
          </p>

          <h1>
            {onlyAttendees
              ? "Peserta hadir"
              : "Seluruh peserta"}
          </h1>

          <p className="muted">
            {rows.length} peserta
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="btn secondary"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "spin" : ""
              }
            />
            Refresh
          </button>

          <button
            className="btn secondary"
            onClick={exportCsv}
            disabled={!rows.length}
          >
            <Download size={17} />
            Export CSV
          </button>

          {!onlyAttendees && (
            <Link
              className="btn primary"
              to="/admin/participants/new"
            >
              <Plus size={18} />
              Tambah peserta
            </Link>
          )}

          <Link
            className="btn secondary"
            to="/scan"
          >
            <QrCode size={18} />
            Scan QR
          </Link>
        </div>
      </div>

      <section className="panel">
        <ParticipantTable
          rows={rows}
          showActions={!onlyAttendees}
        />
      </section>
    </div>
  );
}

function ParticipantForm({
  editId = null,
}) {
  const navigate = useNavigate();

  const isEdit = Boolean(editId);

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    shirt_size: "M",
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!editId) {
      setLoading(false);
      return;
    }

    async function loadParticipant() {
      const { data, error: loadError } =
        await supabase
          .from("participants")
          .select(
            "id,name,whatsapp,shirt_size,checked_in_at,created_at"
          )
          .eq("id", editId)
          .maybeSingle();

      if (loadError || !data) {
        setError(
          "Data peserta tidak ditemukan."
        );
        setLoading(false);
        return;
      }

      setForm({
        name: data.name || "",
        whatsapp: data.whatsapp || "",
        shirt_size:
          data.shirt_size || "M",
      });

      setCreated(data);

      try {
        setQr(await makeQrDataUrl(data));
      } catch {
        setQr("");
      }

      setLoading(false);
    }

    loadParticipant();
  }, [editId]);

  async function submit(event) {
    event.preventDefault();

    setError("");

    const name = form.name.trim();
    const whatsapp = cleanPhone(
      form.whatsapp
    );

    if (name.length < 2) {
      setError(
        "Nama minimal 2 karakter."
      );
      return;
    }

    if (!DEFAULT_SIZES.includes(form.shirt_size)) {
      setError(
        "Ukuran baju tidak valid."
      );
      return;
    }

    if (
      whatsapp.replace(/\D/g, "").length < 8
    ) {
      setError(
        "Nomor WhatsApp belum valid."
      );
      return;
    }

    setSaving(true);

    if (isEdit) {
      const { data, error: updateError } =
        await supabase
          .from("participants")
          .update({
            name,
            whatsapp,
            shirt_size: form.shirt_size,
          })
          .eq("id", editId)
          .select(
            "id,name,whatsapp,shirt_size,checked_in_at,created_at"
          )
          .single();

      setSaving(false);

      if (updateError) {
        setError(
          updateError.message ||
          "Data peserta gagal diperbarui."
        );
        return;
      }

      setCreated(data);

      try {
        setQr(await makeQrDataUrl(data));
      } catch {
        setQr("");
      }

      return;
    }

    const { data, error: insertError } =
      await supabase
        .from("participants")
        .insert({
          name,
          whatsapp,
          shirt_size: form.shirt_size,
        })
        .select(
          "id,name,whatsapp,shirt_size,checked_in_at,created_at"
        )
        .single();

    setSaving(false);

    if (insertError) {
      setError(
        insertError.message ||
        "Peserta gagal ditambahkan."
      );
      return;
    }

    setCreated(data);

    try {
      setQr(await makeQrDataUrl(data));
    } catch {
      setQr("");
    }
  }

  function sendWhatsApp() {
    if (!created) return;

    const number = whatsappNumber(
      created.whatsapp
    );

    const link = publicParticipantUrl(
      created.id
    );

    const message =
      `Halo ${created.name},\n\n` +
      `Registrasi event kamu sudah berhasil.\n\n` +
      `Nama: ${created.name}\n` +
      `Ukuran baju: ${created.shirt_size}\n\n` +
      `E-ticket / QR peserta:\n${link}\n\n` +
      `Silakan simpan e-ticket tersebut dan tunjukkan QR kepada panitia saat check-in.\n\n` +
      `Terima kasih.`;

    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(
        message
      )}`
      : `https://wa.me/?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyTicketLink() {
    if (!created) return;

    const link = publicParticipantUrl(
      created.id
    );

    try {
      await navigator.clipboard.writeText(link);
      alert("Link e-ticket berhasil disalin.");
    } catch {
      alert("Link tidak dapat disalin otomatis.");
    }
  }

  function downloadQr() {
    if (!qr || !created) return;

    const link = document.createElement("a");

    link.href = qr;
    link.download = `qr-${created.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (loading) {
    return <Loading />;
  }

  if (created) {
    return (
      <div className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              {isEdit
                ? "DATA PESERTA"
                : "PESERTA BARU"}
            </p>

            <h1>
              {isEdit
                ? "Peserta berhasil diperbarui"
                : "Peserta berhasil ditambahkan"}
            </h1>

            <p className="muted">
              QR e-ticket dibuat otomatis dari
              data peserta ini.
            </p>
          </div>
        </div>

        <section className="ticket-admin-card">
          <div className="ticket-admin-info">
            <p className="eyebrow">
              E-TICKET
            </p>

            <h2>{created.name}</h2>

            <div className="ticket-details">
              <div>
                <span>WhatsApp</span>
                <strong>
                  {created.whatsapp}
                </strong>
              </div>

              <div>
                <span>Ukuran baju</span>
                <strong>
                  {created.shirt_size}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong
                  className={
                    created.checked_in_at
                      ? "text-success"
                      : ""
                  }
                >
                  {created.checked_in_at
                    ? "Sudah hadir"
                    : "Belum hadir"}
                </strong>
              </div>
            </div>

            <div className="ticket-link-box">
              <span>Link e-ticket</span>

              <div>
                <input
                  value={publicParticipantUrl(
                    created.id
                  )}
                  readOnly
                />

                <button
                  className="icon-btn"
                  onClick={copyTicketLink}
                  title="Copy link"
                >
                  <Copy size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="ticket-admin-qr">
            {qr && (
              <img
                src={qr}
                alt="QR e-ticket peserta"
                className="qr-image large"
              />
            )}

            <button
              className="btn secondary full"
              onClick={downloadQr}
            >
              <Download size={17} />
              Download QR
            </button>
          </div>
        </section>

        <div className="action-grid">
          <button
            className="btn primary"
            onClick={sendWhatsApp}
          >
            <Smartphone size={18} />
            Kirim ke WhatsApp
          </button>

          <a
            className="btn secondary"
            href={publicParticipantUrl(
              created.id
            )}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={18} />
            Buka e-ticket
          </a>

          {isEdit ? (
            <Link
              className="btn ghost"
              to="/admin/participants"
            >
              Kembali ke peserta
            </Link>
          ) : (
            <button
              className="btn ghost"
              onClick={() => {
                setCreated(null);
                setQr("");
                setForm({
                  name: "",
                  whatsapp: "",
                  shirt_size: "M",
                });
              }}
            >
              Tambah peserta lain
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {isEdit
              ? "EDIT PESERTA"
              : "DATA PESERTA"}
          </p>

          <h1>
            {isEdit
              ? "Edit peserta"
              : "Tambah peserta"}
          </h1>

          <p className="muted">
            {isEdit
              ? "Perbarui data peserta."
              : "Masukkan data peserta untuk membuat e-ticket."}
          </p>
        </div>
      </div>

      <section className="form-card admin-form-card">
        {error && (
          <div className="alert error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <form
          onSubmit={submit}
          className="form"
        >
          <label>
            Nama lengkap
            <input
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Contoh: Budi Santoso"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Nomor WhatsApp
            <input
              value={form.whatsapp}
              onChange={(event) =>
                setForm({
                  ...form,
                  whatsapp: event.target.value,
                })
              }
              placeholder="Contoh: 081234567890"
              inputMode="tel"
              autoComplete="tel"
              required
            />

            <small className="field-help">
              Digunakan untuk membuka chat WhatsApp
              peserta secara langsung.
            </small>
          </label>

          <label>
            Ukuran baju
            <select
              value={form.shirt_size}
              onChange={(event) =>
                setForm({
                  ...form,
                  shirt_size: event.target.value,
                })
              }
            >
              {DEFAULT_SIZES.map((size) => (
                <option
                  value={size}
                  key={size}
                >
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <Link
              className="btn ghost"
              to="/admin/participants"
            >
              Batal
            </Link>

            <button
              className="btn primary"
              disabled={saving}
            >
              {saving
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan perubahan"
                  : "Tambah peserta"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ScanPage() {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  useEffect(() => {
    const scanner = new Html5Qrcode(
      "qr-reader"
    );

    scannerRef.current = scanner;

    return () => {
      if (scanner.isScanning) {
        scanner
          .stop()
          .catch(() => { });
      }
    };
  }, []);

  async function start() {
    setMessage("");
    setResult(null);

    if (!scannerRef.current) {
      setMessage(
        "Scanner belum siap. Silakan coba lagi."
      );
      return;
    }

    try {
      await scannerRef.current.start(
        {
          facingMode,
        },
        {
          fps: 10,
          qrbox: {
            width: 240,
            height: 240,
          },
        },
        async (decodedText) => {
          await handleScan(decodedText);
        },
        () => { }
      );

      setRunning(true);
    } catch (error) {
      console.error(error);

      setMessage(
        "Kamera tidak bisa dibuka. Pastikan izin kamera diberikan dan website menggunakan HTTPS."
      );
    }
  }

  async function stop() {
    if (!scannerRef.current) {
      return;
    }

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (error) {
      console.error(error);
    }

    setRunning(false);
  }

  function extractParticipantId(text) {
    if (!text) {
      return null;
    }

    try {
      const url = new URL(text);

      const match =
        url.pathname.match(
          /\/p\/([^/]+)/
        );

      if (match) {
        return match[1];
      }
    } catch {
      // Not a URL, continue below.
    }

    try {
      const parsed = JSON.parse(text);

      if (parsed?.id) {
        return parsed.id;
      }
    } catch {
      // Not JSON.
    }

    return null;
  }

  async function handleScan(text) {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    setMessage("");

    try {
      const id =
        extractParticipantId(text);

      if (!id) {
        setMessage(
          "QR tidak dikenali."
        );
        return;
      }

      await stop();

      /*
       * Penting:
       * Check-in dilakukan menggunakan RPC
       * atomic di database.
       *
       * Jadi jika dua HP melakukan scan
       * peserta yang sama hampir bersamaan,
       * database tetap mencegah double check-in.
       */
      const { data, error } =
        await supabase.rpc(
          "check_in_participant",
          {
            p_id: id,
          }
        );

      if (error) {
        console.error(error);

        setMessage(
          "Gagal memproses check-in."
        );
        return;
      }

      const row = getRpcRow(data);

      if (!row) {
        setMessage(
          "Peserta tidak ditemukan."
        );
        return;
      }

      if (row.already_checked_in) {
        setResult({
          id: row.id,
          name: row.name,
          shirt_size: row.shirt_size,
          checked_in_at:
            row.checked_in_at,
          already: true,
        });

        return;
      }

      setResult({
        id: row.id,
        name: row.name,
        shirt_size: row.shirt_size,
        checked_in_at:
          row.checked_in_at,
        already: false,
      });
    } finally {
      processingRef.current = false;
    }
  }

  async function nextScan() {
    setResult(null);
    setMessage("");
    await start();
  }

  async function toggleCamera() {
    const wasRunning = running;

    if (wasRunning) {
      await stop();
    }

    const nextFacingMode =
      facingMode === "environment"
        ? "user"
        : "environment";

    setFacingMode(nextFacingMode);

    if (wasRunning) {
      // Tunggu state ter-update sebelum start ulang
      // dengan kamera yang baru.
      setTimeout(async () => {
        try {
          await scannerRef.current.start(
            { facingMode: nextFacingMode },
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
            },
            async (decodedText) => {
              await handleScan(decodedText);
            },
            () => { }
          );

          setRunning(true);
        } catch (error) {
          console.error(error);

          setMessage(
            "Kamera tidak bisa dibuka. Pastikan izin kamera diberikan dan website menggunakan HTTPS."
          );
        }
      }, 300);
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            EVENT CHECK-IN
          </p>

          <h1>Scan QR</h1>

          <p className="muted">
            Arahkan kamera ke QR e-ticket peserta.
          </p>
        </div>
      </div>

      {message && (
        <div className="alert error">
          <AlertCircle size={17} />
          {message}
        </div>
      )}

      <section className="scan-card">
        <div
          id="qr-reader"
          className="qr-reader"
        />

        {!running ? (
          <button
            className="btn primary full"
            onClick={start}
          >
            <QrCode size={18} />
            Mulai scan
          </button>
        ) : (
          <button
            className="btn secondary full"
            onClick={stop}
          >
            Hentikan kamera
          </button>
        )}

        <button
          className="btn secondary full"
          onClick={toggleCamera}
        >
          Ganti kamera ({facingMode === "environment" ? "belakang" : "depan"})
        </button>
      </section>

      {result && (
        <section
          className={`checkin-result ${result.already
              ? "warning"
              : "ok"
            }`}
        >
          <div className="result-icon">
            {result.already ? (
              <AlertCircle size={27} />
            ) : (
              <CheckCircle2 size={27} />
            )}
          </div>

          <p className="eyebrow">
            {result.already
              ? "SUDAH HADIR"
              : "CHECK-IN BERHASIL"}
          </p>

          <h2>{result.name}</h2>

          <p>
            Ukuran baju:{" "}
            <strong>
              {result.shirt_size}
            </strong>
          </p>

          <p className="muted">
            {result.already
              ? `Peserta sudah melakukan check-in pada ${formatDate(
                result.checked_in_at
              )}.`
              : "Kehadiran sudah tercatat."}
          </p>

          <button
            className="btn primary"
            onClick={nextScan}
          >
            <QrCode size={18} />
            Scan peserta berikutnya
          </button>
        </section>
      )}
    </div>
  );
}

function PublicParticipant() {
  const { id } = useParams();

  const [row, setRow] = useState(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } =
        await supabase.rpc(
          "get_public_participant",
          {
            p_id: id,
          }
        );

      if (error) {
        console.error(error);
        setRow(null);
        setLoading(false);
        return;
      }

      const participant =
        Array.isArray(data)
          ? data[0]
          : data;

      setRow(
        participant || null
      );

      if (participant) {
        try {
          setQr(
            await makeQrDataUrl(
              participant
            )
          );
        } catch {
          setQr("");
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!row) {
    return (
      <main className="public-page">
        <section className="form-card">
          <div className="hero-icon">
            <AlertCircle size={28} />
          </div>

          <h1>
            Peserta tidak ditemukan
          </h1>

          <p className="muted">
            Link e-ticket mungkin sudah tidak
            valid.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="public-page">
      <section className="ticket-page">
        <div className="success-icon">
          <QrCode size={32} />
        </div>

        <p className="eyebrow">
          E-TICKET PESERTA
        </p>

        <h1>{row.name}</h1>

        <div className="ticket-details">
          <div>
            <span>Ukuran baju</span>
            <strong>
              {row.shirt_size}
            </strong>
          </div>

          <div>
            <span>Status</span>

            <strong
              className={
                row.checked_in_at
                  ? "text-success"
                  : ""
              }
            >
              {row.checked_in_at
                ? "Sudah hadir"
                : "Belum hadir"}
            </strong>
          </div>
        </div>

        {qr && (
          <img
            src={qr}
            alt="QR check-in peserta"
            className="qr-image large"
          />
        )}

        <p className="muted center">
          Tunjukkan QR ini kepada panitia saat
          check-in.
        </p>
      </section>
    </main>
  );
}

function SettingsPage() {
  const [settings, setSettings] =
    useState({
      event_name: "",
      event_subtitle: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function load() {
      const { data, error: loadError } =
        await supabase
          .from("event_settings")
          .select(
            "event_name,event_subtitle"
          )
          .eq("id", 1)
          .single();

      if (loadError) {
        setError(
          "Pengaturan event gagal dimuat."
        );
      } else {
        setSettings({
          event_name:
            data?.event_name || "",
          event_subtitle:
            data?.event_subtitle || "",
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  async function submit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    const { error: updateError } =
      await supabase
        .from("event_settings")
        .update({
          event_name:
            settings.event_name.trim(),
          event_subtitle:
            settings.event_subtitle.trim(),
        })
        .eq("id", 1);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.message ||
        "Pengaturan gagal disimpan."
      );
      return;
    }

    setMessage(
      "Pengaturan berhasil disimpan."
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            SETTINGS
          </p>

          <h1>Pengaturan Event</h1>

          <p className="muted">
            Atur informasi dasar event.
          </p>
        </div>
      </div>

      <section className="form-card admin-form-card">
        {error && (
          <div className="alert error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {message && (
          <div className="alert success">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        <form
          onSubmit={submit}
          className="form"
        >
          <label>
            Nama event
            <input
              value={settings.event_name}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  event_name:
                    event.target.value,
                })
              }
              placeholder="Nama event"
              required
            />
          </label>

          <label>
            Subjudul
            <input
              value={
                settings.event_subtitle
              }
              onChange={(event) =>
                setSettings({
                  ...settings,
                  event_subtitle:
                    event.target.value,
                })
              }
              placeholder="Deskripsi singkat event"
            />
          </label>

          <div className="settings-info">
            <div>
              <Shirt size={18} />
              <div>
                <strong>
                  Ukuran baju
                </strong>

                <span>
                  S, M, L, XL, 2XL, 3XL, 4XL
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn primary"
            disabled={saving}
          >
            <Settings size={17} />
            {saving
              ? "Menyimpan..."
              : "Simpan pengaturan"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>Memuat...</span>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Landing/Login */}
        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Public e-ticket */}
        <Route
          path="/p/:id"
          element={<PublicParticipant />}
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminShell>
              <Dashboard />
            </AdminShell>
          }
        />

        <Route
          path="/admin/participants"
          element={
            <AdminShell>
              <Participants />
            </AdminShell>
          }
        />

        <Route
          path="/admin/participants/new"
          element={
            <AdminShell>
              <ParticipantForm />
            </AdminShell>
          }
        />

        <Route
          path="/admin/participants/:id/edit"
          element={
            <AdminShell>
              <EditParticipant />
            </AdminShell>
          }
        />

        <Route
          path="/admin/attendees"
          element={
            <AdminShell>
              <Participants
                onlyAttendees
              />
            </AdminShell>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminShell>
              <SettingsPage />
            </AdminShell>
          }
        />

        {/* Scanner */}
        <Route
          path="/scan"
          element={
            <AdminShell>
              <ScanPage />
            </AdminShell>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </Layout>
  );
}

function EditParticipant() {
  const { id } = useParams();

  return (
    <ParticipantForm
      editId={id}
    />
  );
}