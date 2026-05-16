import { Link } from 'react-router-dom'
import { ObfuscatedEmail } from '@/components/legal/obfuscated-email'
import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell'
import { legalConfig, termsSections } from '@/config/legal'

export function TermsPage() {
  return (
    <LegalPageShell
      description="The rules, usage terms, and legal limits that apply when you access or play Atlas of Answers."
      eyebrow="Terms of Service"
      title="Terms of Service"
      updatedLabel={`Effective ${legalConfig.contact.effectiveDate}`}
    >
      <div className="rounded-[24px] bg-white/70 p-4 text-sm text-muted-foreground">
        <p>
          These terms apply to your use of {legalConfig.siteName}. For data
          handling details, see the{' '}
          <Link
            className="font-semibold text-foreground underline underline-offset-4"
            to="/privacy"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {termsSections.map((section) => (
        <LegalSection
          bullets={section.bullets}
          heading={section.heading}
          key={section.heading}
          paragraphs={section.paragraphs}
        />
      ))}

      <ObfuscatedEmail />
    </LegalPageShell>
  )
}
