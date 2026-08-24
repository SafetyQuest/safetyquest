// apps/web/app/page.tsx
//
// Public landing page. This is the only page on the site reachable without
// authentication, and it is deliberately a Server Component with no client-side
// JavaScript: every word below must be present in the initial HTML response so
// that crawlers and automated classifiers can read it without executing scripts.
//
// Do not convert this to a client component, and do not move copy into a
// useEffect or a client-only child.

import type { Metadata } from 'next'
import Link from 'next/link'

import { OPERATOR, SUPPORT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'SafetyQuest — Workplace Safety Training Platform',
  description:
    'SafetyQuest is a workplace safety learning platform used by enterprise organizations to deliver, track and record mandatory safety training for employees and contractors.',
  alternates: { canonical: '/' },
}

function Wordmark() {
  return (
    <span className="text-xl font-bold tracking-tight">
      <span style={{ color: 'var(--primary)' }}>Safety</span>
      <span style={{ color: 'var(--primary-light)' }}>Quest</span>
    </span>
  )
}

function Capability({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="p-6 h-full"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </p>
    </div>
  )
}

export default function HomePage() {
  const year = new Date().getFullYear()

  return (
    <div style={{ background: 'var(--background)' }}>
      {/* ================================================================ */}
      {/* Header                                                           */}
      {/* ================================================================ */}
      <header
        style={{
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Wordmark />
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2"
            style={{
              color: 'var(--primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        {/* ============================================================== */}
        {/* Hero                                                           */}
        {/* ============================================================== */}
        <section
          style={{
            background: 'var(--primary-surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-3xl">
              <h1
                className="text-3xl sm:text-4xl font-bold leading-tight mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                SafetyQuest — Workplace Safety Training Platform
              </h1>

              <p
                className="text-lg leading-relaxed mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                SafetyQuest is a workplace safety learning platform used by
                enterprise organizations to deliver, track and record mandatory
                safety training across their workforce.
              </p>

              <p
                className="text-base leading-relaxed mb-8"
                style={{ color: 'var(--text-secondary)' }}
              >
                Organizations assign structured training programs to employees
                and contractors. Learners work through interactive lessons,
                complete assessments, and build a verifiable record of the
                training they have finished. Administrators see who has
                completed what, and who still needs to.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 font-medium"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--text-inverse)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                Sign in
              </Link>

              <p
                className="text-sm mt-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                Access is restricted to personnel of client organizations.
                Accounts are issued by your training administrator.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* What the platform does                                         */}
        {/* ============================================================== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: 'var(--text-primary)' }}
          >
            What the platform does
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Capability title="Structured training programs">
              Training is organized into programs, courses and lessons that
              unlock in sequence. Learners move through material in the order
              their organization intends, and cannot jump ahead to an assessment
              before completing the content it covers.
            </Capability>

            <Capability title="Interactive, scenario-based lessons">
              Lessons go beyond slides and video. Learners identify hazards in
              workplace photographs, sort equipment and procedures under time
              pressure, put the steps of a safety process into the correct
              order, and work through decision-based scenarios drawn from real
              operational situations.
            </Capability>

            <Capability title="Assessment and record-keeping">
              Lessons and courses can carry an assessment with a configurable
              pass mark. Scores, attempts and completion dates are recorded
              against each learner, producing an auditable record of who was
              trained on what, and when.
            </Capability>

            <Capability title="Administration and oversight">
              Administrators create and assign training, either to individuals
              or to defined user types so new joiners inherit the right programs
              automatically. The workforce can be organized and filtered by
              department, section, designation and reporting line, with a
              central dashboard showing activity and completion across the
              organization.
            </Capability>
          </div>
        </section>

        {/* ============================================================== */}
        {/* Built for completion                                           */}
        {/* ============================================================== */}
        <section
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-3xl">
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Built for completion
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Mandatory training is only useful if people actually finish it.
                SafetyQuest saves progress so learners can stop and resume
                exactly where they left off, recognizes consistent
                participation, and awards achievement milestones as learners
                work through their assigned programs. The aim is
                straightforward: higher completion rates, with less chasing from
                administrators.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* How access works                                               */}
        {/* ============================================================== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              How access works
            </h2>

            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              SafetyQuest is not a public service and has no self-registration.
            </p>

            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              Accounts are created by an administrator at your organization, who
              assigns the training relevant to your role. When your account is
              created you will receive an email containing your sign-in address
              and a temporary password. You will be asked to set your own
              password the first time you sign in.
            </p>

            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              If you are expecting access and have not received your
              credentials, contact your organization&rsquo;s training
              administrator in the first instance.
            </p>

            {/* Security note — placed here as ordinary user guidance rather
                than as a defensive claim in the hero. */}
            <aside
              className="p-5"
              style={{
                background: 'var(--primary-surface)',
                borderLeft: '4px solid var(--primary-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--primary-dark)' }}
              >
                Security note
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                SafetyQuest will never ask for your password by email, and never
                sends unsolicited messages. Your welcome email arrives only
                after an administrator at your organization creates your
                account. If you receive anything claiming to be from SafetyQuest
                that you were not expecting, contact your training administrator
                before acting on it.
              </p>
            </aside>
          </div>
        </section>

        {/* ============================================================== */}
        {/* Support                                                        */}
        {/* ============================================================== */}
        <section
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl">
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Support
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                For technical problems with the platform, contact us at{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium underline"
                  style={{ color: 'var(--primary)' }}
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================ */}
      {/* Footer                                                           */}
      {/* ================================================================ */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Wordmark />
              <p
                className="text-sm mt-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                SafetyQuest is developed and operated by {OPERATOR}.
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                &copy; {year} {OPERATOR}. All rights reserved.
              </p>
            </div>

            <Link
              href="/login"
              className="text-sm font-medium self-start sm:self-auto"
              style={{ color: 'var(--primary)' }}
            >
              Sign in &rarr;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
