import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Reglas del Servicio | MUNDOSUBS',
  description: 'Términos de servicio, reglas de uso y penalizaciones de MUNDOSUBS.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black mb-8">Términos y Reglas del Servicio</h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y realizar compras en MUNDOSUBS, aceptas estar sujeto a estos términos y condiciones. 
              Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Naturaleza del Servicio</h2>
            <p>
              MUNDOSUBS actúa como un intermediario digital para proveer acceso a suscripciones y licencias 
              digitales (streaming, software, juegos). El acceso se otorga por el tiempo especificado en cada 
              producto una vez que el pago ha sido validado manualmente por nuestro equipo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 text-orange-500">3. Reglas Estrictas de Uso</h2>
            <p className="mb-4">Para garantizar el funcionamiento correcto y la seguridad de todos nuestros usuarios, es obligatorio cumplir las siguientes reglas:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>No cambiar contraseñas:</strong> Está estrictamente prohibido intentar cambiar la contraseña, el correo de acceso o el método de pago de cualquier cuenta proporcionada.</li>
              <li><strong>No modificar perfiles ajenos:</strong> En servicios de streaming compartidos, solo debes utilizar el perfil que se te asigne (si aplica) o crear solo tu perfil. No debes borrar ni modificar los perfiles de otros usuarios.</li>
              <li><strong>Uso personal:</strong> La reventa de las cuentas proporcionadas está prohibida a menos que se indique explícitamente que es un producto para revendedores.</li>
              <li><strong>Límites de dispositivos:</strong> Debes respetar el límite de pantallas o dispositivos simultáneos especificados al momento de la compra.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 text-red-500">4. Penalizaciones por Incumplimiento</h2>
            <p className="mb-4">Cualquier violación a las reglas mencionadas anteriormente resultará en las siguientes acciones inmediatas:</p>
            <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-foreground">
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Suspensión inmediata:</strong> Cancelación total del acceso al servicio adquirido de forma inmediata.</li>
                <li><strong>Sin derecho a reembolso:</strong> No se emitirá ningún reembolso, parcial o total, si la cuenta es cancelada por incumplimiento de las reglas.</li>
                <li><strong>Bloqueo de la plataforma:</strong> El usuario (y su correo/IP asociados) será bloqueado permanentemente y no podrá volver a comprar en MUNDOSUBS.</li>
              </ul>
            </div>
            <p className="mt-4 text-sm">Contamos con sistemas de monitoreo para detectar cambios en las credenciales de las cuentas.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Pagos y Reembolsos</h2>
            <p>
              Los pagos se validan de forma manual mediante comprobante (voucher). Si el comprobante es falso, 
              alterado, o pertenece a otra transacción, la orden será rechazada y la cuenta bloqueada. 
              Los reembolsos solo proceden si MUNDOSUBS no puede entregar el servicio prometido en un plazo máximo 
              de 48 horas tras la validación del pago.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
