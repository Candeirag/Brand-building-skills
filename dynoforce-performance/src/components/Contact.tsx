import { ArrowRight, Check, Copy } from 'lucide-react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { brand, serviceOptions, whatsappUrl } from '../config/siteConfig';
import { useRequestedService } from '../state/bookingStore';
import { Heading } from './Heading';

interface FormValues {
  name: string;
  phone: string;
  vehicle: string;
  year: string;
  engine: string;
  service: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = { name: '', phone: '', vehicle: '', year: '', engine: '', service: '', notes: '' };
const MAX_YEAR = new Date().getFullYear() + 1;

/** (61) 99999-9999 enquanto digita. */
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = 'Informe seu nome.';
  const digits = values.phone.replace(/\D/g, '');
  if (digits.length < 10) errors.phone = 'Informe o WhatsApp com DDD, 10 ou 11 dígitos.';
  if (values.vehicle.trim().length < 3) errors.vehicle = 'Informe a marca e o modelo, como "VW Golf GTI".';
  const year = Number(values.year);
  if (!/^\d{4}$/.test(values.year) || year < 1980 || year > MAX_YEAR)
    errors.year = `Informe o ano com quatro dígitos, entre 1980 e ${MAX_YEAR}.`;
  if (!values.service) errors.service = 'Escolha um serviço.';
  return errors;
}

function buildMessage(values: FormValues): string {
  const lines = [
    `Olá! Quero agendar uma sessão na ${brand.name}.`,
    '',
    `Nome: ${values.name.trim()}`,
    `WhatsApp: ${values.phone}`,
    `Veículo: ${values.vehicle.trim()} (${values.year})`,
  ];
  if (values.engine.trim()) lines.push(`Motorização: ${values.engine.trim()}`);
  lines.push(`Serviço: ${values.service}`);
  if (values.notes.trim()) lines.push(`Observações: ${values.notes.trim()}`);
  return lines.join('\n');
}

const inputClass =
  'mt-2 block w-full bg-graphite px-4 py-[14px] text-[17px] text-ink placeholder:text-ink/35 outline-none transition-[box-shadow,background-color] duration-300 focus:bg-steel focus:shadow-[inset_0_-2px_0_var(--brand-accent)] aria-[invalid=true]:shadow-[inset_0_-2px_0_var(--brand-accent)]';

export function Contact() {
  const id = useId();
  const requested = useRequestedService();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (requested) setValues((current) => ({ ...current, service: requested }));
  }, [requested]);

  const update = (key: keyof FormValues, value: string) => {
    const next = { ...values, [key]: key === 'phone' ? maskPhone(value) : value };
    setValues(next);
    setMessage(null);
    if (submitted) setErrors(validate(next));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }
    const text = buildMessage(values);
    setMessage(text);
    setCopied(false);
    // Abre o WhatsApp com a mensagem pronta. Nada é enviado por este site.
    window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
  };

  const copy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const field = (
    key: keyof FormValues,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    optional = false,
  ) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="text-[15px] text-ink">
        {label}
        {optional && <span className="ml-2 text-ink/50">opcional</span>}
      </label>
      <input
        id={`${id}-${key}`}
        name={key}
        value={values[key]}
        onChange={(event) => update(key, event.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${id}-${key}-erro` : undefined}
        required={!optional}
        className={inputClass}
        {...props}
      />
      {errors[key] && (
        <p id={`${id}-${key}-erro`} className="mt-2 text-[14px] text-accent">
          {errors[key]}
        </p>
      )}
    </div>
  );

  const { contact } = brand;

  return (
    <section id="contato" aria-labelledby="contato-titulo" className="gutter py-[120px] lg:py-[200px]">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-5">
          <Heading
            id="contato-titulo"
            lines={['Agende', 'sua sessão.']}
            className="text-[clamp(40px,11.2vw,72px)] lg:text-[clamp(52px,5.5vw,104px)]"
          />
          <p data-reveal className="mt-7 max-w-[25em] text-[17px] text-ink lg:mt-10 lg:text-[19px]">
            Preencha os dados do carro e o WhatsApp abre com a mensagem pronta. A conversa continua
            por lá, com quem vai cuidar do projeto.
          </p>

          <dl data-reveal className="mt-10 space-y-6 lg:mt-14">
            <div>
              <dt className="text-[15px] text-ink/60">WhatsApp</dt>
              <dd className="mt-1">
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="link num text-[22px] text-ink lg:text-[26px]">
                  +{contact.whatsappPhone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '$1 ($2) $3-$4')}
                </a>
              </dd>
            </div>
            {contact.instagram && (
              <div>
                <dt className="text-[15px] text-ink/60">Instagram</dt>
                <dd className="mt-1">
                  <a href={contact.instagram.url} target="_blank" rel="noreferrer" className="link text-[20px] text-ink lg:text-[22px]">
                    {contact.instagram.handle}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[15px] text-ink/60">Oficina</dt>
              <dd className="mt-1 text-[18px] text-ink lg:text-[20px]">
                {contact.address}
                <br />
                {contact.city}
              </dd>
            </div>
            <div>
              <dt className="text-[15px] text-ink/60">Horário</dt>
              <dd className="mt-1 text-[18px] text-ink lg:text-[20px]">{contact.hours}</dd>
            </div>
          </dl>
        </div>

        <form
          data-reveal
          noValidate
          onSubmit={onSubmit}
          className="min-w-0 lg:col-span-6 lg:col-start-7"
          aria-label="Agendamento por WhatsApp"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {field('name', 'Nome', { autoComplete: 'name', placeholder: 'Como podemos te chamar' })}
            {field('phone', 'WhatsApp', {
              type: 'tel',
              inputMode: 'tel',
              autoComplete: 'tel-national',
              placeholder: '(00) 00000-0000',
            })}
            {field('vehicle', 'Marca e modelo', { placeholder: 'VW Golf GTI' })}
            {field('year', 'Ano', { inputMode: 'numeric', maxLength: 4, placeholder: '2021' })}
            {field('engine', 'Motorização', { placeholder: '2.0 turbo' }, true)}
            <div>
              <label htmlFor={`${id}-service`} className="text-[15px] text-ink">
                Serviço desejado
              </label>
              <select
                id={`${id}-service`}
                name="service"
                value={values.service}
                onChange={(event) => update('service', event.target.value)}
                aria-invalid={errors.service ? true : undefined}
                aria-describedby={errors.service ? `${id}-service-erro` : undefined}
                required
                className={`${inputClass} appearance-none ${values.service ? '' : 'text-ink/35'}`}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {serviceOptions.map((option) => (
                  <option key={option} value={option} className="bg-graphite text-ink">
                    {option}
                  </option>
                ))}
              </select>
              {errors.service && (
                <p id={`${id}-service-erro`} className="mt-2 text-[14px] text-accent">
                  {errors.service}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor={`${id}-notes`} className="text-[15px] text-ink">
              Observações<span className="ml-2 text-ink/50">opcional</span>
            </label>
            <textarea
              id={`${id}-notes`}
              name="notes"
              rows={4}
              value={values.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Modificações já feitas, combustível, objetivo do projeto"
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button type="submit" className="btn btn-primary w-full !px-4 sm:w-auto sm:!px-[26px]">
              Gerar mensagem no WhatsApp
              <ArrowRight size={16} className="btn-arrow" aria-hidden="true" />
            </button>
            <p className="text-[14px] text-ink/60">Nada é enviado por este site.</p>
          </div>

          <div aria-live="polite">
            {message && (
              <div className="mt-8 bg-graphite p-5 lg:p-7">
                <p className="flex items-center gap-3 font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-ink">
                  <Check size={18} className="text-accent" aria-hidden="true" />
                  Mensagem pronta
                </p>
                <p className="mt-2 text-[15px] text-ink/70">
                  O WhatsApp foi aberto numa nova aba. Se o navegador bloqueou, use o botão abaixo.
                </p>
                <pre className="mt-4 whitespace-pre-wrap bg-void p-4 font-sans text-[15px] leading-[1.5] text-ink">
                  {message}
                </pre>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Abrir WhatsApp
                  </a>
                  <button type="button" onClick={() => void copy()} className="btn btn-ghost">
                    {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {copied ? 'Copiada' : 'Copiar mensagem'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {contact.whatsappIsPlaceholder && (
            <p className="mt-6 text-[14px] text-ink/60">
              Aviso para quem publica o site: o número de WhatsApp ainda é o de exemplo. Troque em{' '}
              <code className="num text-ink">src/config/siteConfig.ts</code>.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
