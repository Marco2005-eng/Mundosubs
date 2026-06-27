'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building, Facebook, Image, Loader2, Mail, MessageCircle, Music2, Save, Settings, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SettingKey =
  | 'whatsapp_number'
  | 'business_name'
  | 'contact_email'
  | 'facebook_url'
  | 'tiktok_url'
  | 'footer_tagline'
  | 'about_title'
  | 'about_summary'
  | 'about_history'
  | 'about_images'

const SETTINGS_KEYS: SettingKey[] = [
  'whatsapp_number',
  'business_name',
  'contact_email',
  'facebook_url',
  'tiktok_url',
  'footer_tagline',
  'about_title',
  'about_summary',
  'about_history',
  'about_images',
]

const DEFAULT_VALUES: Record<SettingKey, string> = {
  whatsapp_number: '',
  business_name: 'MUNDOSUBS',
  contact_email: '',
  facebook_url: '',
  tiktok_url: '',
  footer_tagline: 'Suscripciones digitales en soles, sin tarjeta internacional.',
  about_title: 'Quiénes somos',
  about_summary: 'Somos una tienda peruana de suscripciones digitales pensada para comprar en soles y recibir soporte directo.',
  about_history: '',
  about_images: '',
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<SettingKey, string>>(DEFAULT_VALUES)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('settings')
      .select('key, value')
      .in('key', SETTINGS_KEYS)
      .then(({ data }) => {
        if (!data) return
        const map = Object.fromEntries(data.map((item) => [item.key, item.value ?? '']))
        setValues((prev) => ({ ...prev, ...map }))
      })
  }, [])

  function updateValue(key: SettingKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setSaved(false)

    const supabase = createClient()
    const rows = SETTINGS_KEYS.map((key) => ({ key, value: values[key] ?? '' }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })

    setLoading(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)

    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `about/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('site-assets').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) continue
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
      if (data.publicUrl) uploadedUrls.push(data.publicUrl)
    }

    if (uploadedUrls.length) {
      const current = values.about_images
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
      updateValue('about_images', [...current, ...uploadedUrls].join('\n'))
    }

    setUploading(false)
  }

  function removeImage(url: string) {
    const next = values.about_images
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item && item !== url)
      .join('\n')
    updateValue('about_images', next)
  }

  const aboutImages = values.about_images
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div className="admin-settings-page">
      <header className="admin-settings-header">
        <Link href="/admin" className="admin-settings-back" aria-label="Volver al panel">
          <ArrowLeft aria-hidden="true" />
        </Link>
        <div>
          <h1>Configuración</h1>
          <p>Ajustes generales, redes y contenido institucional del sitio.</p>
        </div>
      </header>

      <div className="admin-settings-grid">
        <section className="admin-settings-card">
          <h2><Settings aria-hidden="true" /> Configuración general</h2>
          <Field icon={MessageCircle} label="Número de WhatsApp">
            <input
              className="input-dark"
              value={values.whatsapp_number}
              onChange={(event) => updateValue('whatsapp_number', event.target.value)}
              placeholder="51900000000"
            />
          </Field>
          <Field icon={Building} label="Nombre del negocio">
            <input
              className="input-dark"
              value={values.business_name}
              onChange={(event) => updateValue('business_name', event.target.value)}
              placeholder="MUNDOSUBS"
            />
          </Field>
          <Field icon={Mail} label="Email de contacto">
            <input
              className="input-dark"
              type="email"
              value={values.contact_email}
              onChange={(event) => updateValue('contact_email', event.target.value)}
              placeholder="soporte@mundosubs.net.pe"
            />
          </Field>
        </section>

        <section className="admin-settings-card">
          <h2><Facebook aria-hidden="true" /> Redes y footer</h2>
          <Field icon={Facebook} label="Facebook">
            <input
              className="input-dark"
              value={values.facebook_url}
              onChange={(event) => updateValue('facebook_url', event.target.value)}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field icon={Music2} label="TikTok">
            <input
              className="input-dark"
              value={values.tiktok_url}
              onChange={(event) => updateValue('tiktok_url', event.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </Field>
          <Field icon={Mail} label="Texto corto del footer">
            <textarea
              className="input-dark"
              rows={3}
              value={values.footer_tagline}
              onChange={(event) => updateValue('footer_tagline', event.target.value)}
              placeholder="Texto breve para presentar la web."
            />
          </Field>
        </section>

        <section className="admin-settings-card admin-settings-wide">
          <h2><Image aria-hidden="true" /> Quiénes somos e historia</h2>
          <div className="admin-settings-two">
            <Field icon={Building} label="Título de la sección">
              <input
                className="input-dark"
                value={values.about_title}
                onChange={(event) => updateValue('about_title', event.target.value)}
                placeholder="Quiénes somos"
              />
            </Field>
            <Field icon={Mail} label="Resumen corto">
              <textarea
                className="input-dark"
                rows={4}
                value={values.about_summary}
                onChange={(event) => updateValue('about_summary', event.target.value)}
                placeholder="Cuenta en pocas líneas qué hace MUNDOSUBS."
              />
            </Field>
          </div>
          <Field icon={Settings} label="Historia">
            <textarea
              className="input-dark"
              rows={5}
              value={values.about_history}
              onChange={(event) => updateValue('about_history', event.target.value)}
              placeholder="Ej: Nacimos para facilitar el acceso a servicios digitales en Perú..."
            />
          </Field>
          <div className="admin-settings-field">
            <span>
              <Image aria-hidden="true" />
              Imágenes del carrusel
            </span>
            <label className="admin-upload-box">
              <Upload aria-hidden="true" />
              <strong>{uploading ? 'Subiendo imágenes...' : 'Subir imágenes desde tu equipo'}</strong>
              <small>JPG, PNG o WebP. Puedes seleccionar varias.</small>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={uploading}
                onChange={(event) => handleImageUpload(event.target.files)}
              />
            </label>

            {aboutImages.length > 0 && (
              <div className="admin-image-list">
                {aboutImages.map((url) => (
                  <div key={url} className="admin-image-item">
                    <img src={url} alt="" />
                    <span>{url}</span>
                    <button type="button" onClick={() => removeImage(url)} aria-label="Quitar imagen">
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="input-dark admin-image-url-editor"
              rows={3}
              value={values.about_images}
              onChange={(event) => updateValue('about_images', event.target.value)}
              placeholder="URLs guardadas automáticamente. También puedes pegar una URL por línea."
            />
            <span className="admin-settings-help">Las imágenes se guardan en Supabase Storage y se muestran públicamente en /nosotros.</span>
          </div>
        </section>
      </div>

      <div className="admin-settings-actions">
        <button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Save aria-hidden="true" />}
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      <div className="admin-settings-note">
        El WhatsApp debe incluir código de país sin símbolos ni espacios. Ejemplo Perú: 51987654321.
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Settings
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="admin-settings-field">
      <span>
        <Icon aria-hidden="true" />
        {label}
      </span>
      {children}
    </label>
  )
}
