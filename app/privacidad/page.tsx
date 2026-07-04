import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Políticas de Privacidad | MUNDOSUBS',
  description: 'Conoce cómo recopilamos, usamos y protegemos tu información en MUNDOSUBS.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black mb-8">Políticas de Privacidad</h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Información que Recopilamos</h2>
            <p>
              En MUNDOSUBS respetamos tu privacidad. Al registrarte y utilizar nuestra plataforma, recopilamos 
              únicamente la información estrictamente necesaria para brindarte el servicio:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Información de cuenta:</strong> Correo electrónico y nombre para identificar tu perfil y asignarte tus compras.</li>
              <li><strong>Datos de transacciones:</strong> Registros de tus pedidos, historial de compras y los comprobantes (vouchers) que subes para validar tus pagos.</li>
              <li><strong>No almacenamos tarjetas:</strong> Al ser un sistema de pago manual por transferencia, MUNDOSUBS <strong>NO</strong> solicita ni almacena datos de tarjetas de crédito o débito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Uso de la Información</h2>
            <p>
              La información recopilada se utiliza exclusivamente para los siguientes propósitos:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Validar tus pagos mediante la revisión de los comprobantes subidos.</li>
              <li>Enviarte las credenciales de acceso a las suscripciones que has adquirido y notificarte cuando tu servicio esté a punto de expirar.</li>
              <li>Calcular y aplicar automáticamente tus descuentos por lealtad.</li>
              <li>Atender tus consultas a través de nuestro soporte por WhatsApp o correo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Protección y Seguridad de tus Datos</h2>
            <p>
              Todos tus datos, incluyendo las imágenes de tus comprobantes, son almacenados en servidores seguros con 
              encriptación. Los comprobantes son estrictamente confidenciales y solo pueden ser visualizados por los administradores de 
              MUNDOSUBS para propósitos de verificación. No compartimos, vendemos, ni alquilamos tu información a terceros bajo ninguna circunstancia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Retención de Comprobantes</h2>
            <p>
              Las imágenes de los comprobantes de pago subidos son almacenadas de forma privada y segura. 
              Mantenemos estos registros por un periodo limitado para auditorías internas de las transacciones y resolución de disputas, 
              tras lo cual pueden ser eliminados de nuestros servidores.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Enlaces de Terceros</h2>
            <p>
              Ocasionalmente, nuestra plataforma puede contener enlaces a servicios externos (por ejemplo, al redirigirte a WhatsApp para soporte). 
              Estas plataformas tienen sus propias políticas de privacidad independientes, por lo que no tenemos responsabilidad sobre el contenido y las actividades de estos sitios enlazados.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
