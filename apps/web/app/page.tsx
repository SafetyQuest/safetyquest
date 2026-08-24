// apps/web/app/page.tsx
//
// Public landing page. This is the only page on the site reachable without
// authentication, and it is deliberately a Server Component with no client-side
// JavaScript: every word below must be present in the initial HTML response so
// that crawlers and automated classifiers can read it without executing scripts.
//
// Do not convert this to a client component, and do not move copy into a
// useEffect or a client-only child. All motion here is pure CSS (see the blob
// keyframes in globals.css) precisely so that no JS is required to render it.
//
// lucide-react is safe here — its icons are plain SVG components with no
// 'use client' directive, so they render server-side.

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Flame,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'

import { OPERATOR, SUPPORT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'SafetyQuest — Workplace Safety Training Platform',
  description:
    'SafetyQuest is a workplace safety learning platform used by enterprise organizations to deliver, track and record mandatory safety training for employees and contractors.',
  alternates: { canonical: '/' },
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Wordmark({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span style={{ color: 'var(--primary)' }}>Safety</span>
      <span style={{ color: 'var(--primary-light)' }}>Quest</span>
    </span>
  )
}

function IconTile({
  icon,
  from,
  to,
  size = 'md',
}: {
  icon: React.ReactNode
  from: string
  to: string
  size?: 'md' | 'lg'
}) {
  const box = size === 'lg' ? 'w-20 h-20 rounded-2xl' : 'w-12 h-12 rounded-xl'
  return (
    <div
      className={`${box} inline-flex items-center justify-center shadow-lg shrink-0`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {icon}
    </div>
  )
}

function CapabilityCard({
  icon,
  from,
  to,
  title,
  children,
}: {
  icon: React.ReactNode
  from: string
  to: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-xl p-7 h-full transition-transform duration-300 hover:-translate-y-1"
      style={{ border: '1px solid var(--border)' }}
    >
      <IconTile icon={icon} from={from} to={to} />
      <h3
        className="text-lg font-semibold mt-5 mb-2"
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

function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-6 h-full"
      style={{ border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm font-bold text-white shadow-md"
        style={{
          background:
            'linear-gradient(135deg, var(--primary), var(--primary-light))',
        }}
      >
        {n}
      </div>
      <h3
        className="font-semibold mt-4 mb-2"
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

function Highlight({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0"
        style={{ background: 'var(--primary-surface)' }}
      >
        {icon}
      </div>
      <div>
        <p
          className="font-semibold text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const year = new Date().getFullYear()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ---------------------------------------------------------- */}
      {/* Ambient background — same treatment as the login page       */}
      {/* ---------------------------------------------------------- */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(to bottom right, #EFF8FF 0%, #FFFFFF 45%, #FDF2F8 100%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -right-32 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"
          style={{ background: 'var(--primary-light)' }}
        />
        <div
          className="absolute top-1/3 -left-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"
          style={{ background: 'var(--highlight)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"
          style={{ background: 'var(--primary)' }}
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Header                                                      */}
      {/* ---------------------------------------------------------- */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          background: 'rgba(255,255,255,0.75)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">
              🎓
            </span>
            <Wordmark />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-5 py-2.5 rounded-lg shadow-md transition-transform duration-150 hover:scale-[1.03]"
            style={{
              background:
                'linear-gradient(to right, var(--primary), var(--primary-light))',
            }}
          >
            Sign in
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* -------------------------------------------------------- */}
        {/* Hero                                                      */}
        {/* -------------------------------------------------------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <IconTile
            size="lg"
            from="var(--primary)"
            to="var(--primary-light)"
            icon={
              <span className="text-4xl" aria-hidden="true">
                🎓
              </span>
            }
          />

          <h1 className="mt-8 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            <Wordmark className="text-4xl sm:text-5xl" />
            <span
              className="block mt-3 text-2xl sm:text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Workplace Safety Training Platform
            </span>
          </h1>

          <p
            className="mt-6 text-lg leading-relaxed max-w-3xl mx-auto"
            style={{ color: 'var(--text-primary)' }}
          >
            SafetyQuest is a workplace safety learning platform used by
            enterprise organizations to deliver, track and record mandatory
            safety training across their workforce.
          </p>

          <p
            className="mt-4 text-base leading-relaxed max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Organizations assign structured training programs to employees and
            contractors. Learners work through interactive lessons, complete
            assessments, and build a verifiable record of the training they have
            finished. Administrators see who has completed what, and who still
            needs to.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 font-medium text-white rounded-xl shadow-lg transition-transform duration-150 hover:scale-[1.03] hover:shadow-xl"
              style={{
                background:
                  'linear-gradient(to right, var(--primary), var(--primary-light))',
              }}
            >
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ShieldCheck
                className="w-4 h-4"
                style={{ color: 'var(--success-dark)' }}
              />
              Access is restricted to personnel of client organizations.
              Accounts are issued by your training administrator.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* What the platform does                                    */}
        {/* -------------------------------------------------------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <h2
            className="text-3xl font-bold text-center mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            What the platform does
          </h2>
          <p
            className="text-center mb-12 max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Everything needed to run mandatory safety training end to end, from
            authoring the content to proving it was completed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CapabilityCard
              icon={<BookOpen className="w-6 h-6 text-white" />}
              from="var(--primary)"
              to="var(--primary-light)"
              title="Structured training programs"
            >
              Training is organized into programs, courses and lessons that
              unlock in sequence. Learners move through material in the order
              their organization intends, and cannot jump ahead to an assessment
              before completing the content it covers.
            </CapabilityCard>

            <CapabilityCard
              icon={<Sparkles className="w-6 h-6 text-white" />}
              from="var(--highlight)"
              to="var(--warning)"
              title="Interactive, scenario-based lessons"
            >
              Lessons go beyond slides and video. Learners identify hazards in
              workplace photographs, sort equipment and procedures under time
              pressure, put the steps of a safety process into the correct
              order, and work through decision-based scenarios drawn from real
              operational situations.
            </CapabilityCard>

            <CapabilityCard
              icon={<ClipboardCheck className="w-6 h-6 text-white" />}
              from="var(--success-dark)"
              to="var(--success)"
              title="Assessment and record-keeping"
            >
              Lessons and courses can carry an assessment with a configurable
              pass mark. Scores, attempts and completion dates are recorded
              against each learner, producing an auditable record of who was
              trained on what, and when.
            </CapabilityCard>

            <CapabilityCard
              icon={<BarChart3 className="w-6 h-6 text-white" />}
              from="var(--primary-dark)"
              to="var(--primary)"
              title="Administration and oversight"
            >
              Administrators create and assign training, either to individuals
              or to defined user types so new joiners inherit the right programs
              automatically. The workforce can be organized and filtered by
              department, section, designation and reporting line, with a
              central dashboard showing activity and completion across the
              organization.
            </CapabilityCard>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Built for completion                                      */}
        {/* -------------------------------------------------------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div
            className="rounded-3xl shadow-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div
                className="p-10 lg:p-12"
                style={{
                  background:
                    'linear-gradient(135deg, var(--primary), var(--primary-light))',
                }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">
                  Built for completion
                </h2>
                <p className="text-base leading-relaxed text-white/90">
                  Mandatory training is only useful if people actually finish
                  it. SafetyQuest saves progress so learners can stop and resume
                  exactly where they left off, recognizes consistent
                  participation, and awards achievement milestones as learners
                  work through their assigned programs. The aim is
                  straightforward: higher completion rates, with less chasing
                  from administrators.
                </p>
              </div>

              <div className="bg-white p-10 lg:p-12 flex flex-col justify-center gap-7">
                <Highlight
                  icon={
                    <Target
                      className="w-5 h-5"
                      style={{ color: 'var(--primary)' }}
                    />
                  }
                  title="Resume where you left off"
                >
                  Progress is saved as learners work, so an interrupted lesson
                  picks up at the same step.
                </Highlight>

                <Highlight
                  icon={
                    <Flame
                      className="w-5 h-5"
                      style={{ color: 'var(--warning)' }}
                    />
                  }
                  title="Consistent participation is recognized"
                >
                  Returning day after day is tracked and reflected back to the
                  learner.
                </Highlight>

                <Highlight
                  icon={
                    <Trophy
                      className="w-5 h-5"
                      style={{ color: 'var(--highlight)' }}
                    />
                  }
                  title="Achievement milestones"
                >
                  Learners earn milestones as they progress through their
                  assigned programs.
                </Highlight>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* How access works                                          */}
        {/* -------------------------------------------------------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <h2
            className="text-3xl font-bold text-center mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            How access works
          </h2>
          <p
            className="text-center mb-12 max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            SafetyQuest is not a public service and has no self-registration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step n={1} title="An administrator creates your account">
              Accounts are created by an administrator at your organization, who
              assigns the training relevant to your role.
            </Step>
            <Step n={2} title="You receive a welcome email">
              When your account is created you will receive an email containing
              your sign-in address and a temporary password.
            </Step>
            <Step n={3} title="You set your own password">
              You will be asked to set your own password the first time you sign
              in, and can then start your assigned training.
            </Step>
          </div>

          <p
            className="text-base leading-relaxed text-center mt-10 max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            If you are expecting access and have not received your credentials,
            contact your organization&rsquo;s training administrator in the
            first instance.
          </p>

          {/* Security note — ordinary user guidance, not a defensive claim. */}
          <aside
            className="mt-10 max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6"
            style={{ borderLeft: '4px solid var(--primary-light)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0"
                style={{ background: 'var(--primary-surface)' }}
              >
                <ShieldCheck
                  className="w-5 h-5"
                  style={{ color: 'var(--primary)' }}
                />
              </div>
              <div>
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
                  SafetyQuest will never ask for your password by email, and
                  never sends unsolicited messages. Your welcome email arrives
                  only after an administrator at your organization creates your
                  account. If you receive anything claiming to be from
                  SafetyQuest that you were not expecting, contact your training
                  administrator before acting on it.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Support                                                   */}
        {/* -------------------------------------------------------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div
            className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center"
            style={{ border: '1px solid var(--border)' }}
          >
            <IconTile
              icon={<Mail className="w-6 h-6 text-white" />}
              from="var(--primary)"
              to="var(--primary-light)"
            />
            <h2
              className="text-xl font-bold mt-5 mb-2"
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
                className="font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      {/* ---------------------------------------------------------- */}
      {/* Footer                                                      */}
      {/* ---------------------------------------------------------- */}
      <footer
        className="relative z-10"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.75)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl" aria-hidden="true">
                  🎓
                </span>
                <Wordmark />
              </div>
              <p
                className="text-sm mt-3"
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
              className="inline-flex items-center gap-1.5 text-sm font-medium self-start sm:self-auto"
              style={{ color: 'var(--primary)' }}
            >
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
