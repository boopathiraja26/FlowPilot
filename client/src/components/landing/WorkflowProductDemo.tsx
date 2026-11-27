"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock,
  Mail,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

const STAGES = [
  {
    label: "Trigger",
    title: "A signal starts the run",
    description: "An incoming event is validated and becomes the workflow's starting context.",
  },
  {
    label: "Design",
    title: "Connect the steps",
    description: "Shape the path from an inbound webhook to Gemini and a configured email action.",
  },
  {
    label: "Execute",
    title: "Watch work move forward",
    description: "Each step receives the previous result; the queue records progress as the run advances.",
  },
  {
    label: "Monitor",
    title: "Keep the outcome in view",
    description: "Review step status, timing, and the response captured for this simulated run.",
  },
] as const;

const DEMO_STEPS = [
  { id: "webhook", label: "Inbound webhook", kind: "TRIGGER", icon: Zap },
  { id: "gemini", label: "Gemini AI", kind: "AI", icon: Sparkles },
  { id: "email", label: "Send email", kind: "EMAIL", icon: Mail },
] as const;

type DemoStepId = (typeof DEMO_STEPS)[number]["id"];

const STEP_DURATIONS: Record<DemoStepId, string> = {
  webhook: "18 ms",
  gemini: "412 ms",
  email: "72 ms",
};

const STEP_RESULTS: Record<DemoStepId, string> = {
  webhook: "Payload accepted",
  gemini: "Summary prepared",
  email: "SMTP response · 250 OK",
};

export function WorkflowProductDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const [executionStep, setExecutionStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timersRef = useRef<number[]>([]);
  const autoStartTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const replay = useCallback(() => {
    if (autoStartTimerRef.current !== null) {
      window.clearTimeout(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }
    clearTimers();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveStage(3);
      setExecutionStep(3);
      setIsPlaying(false);
      return;
    }

    setActiveStage(0);
    setExecutionStep(0);
    setIsPlaying(true);

    const schedule = (delay: number, callback: () => void) => {
      timersRef.current.push(window.setTimeout(callback, delay));
    };

    schedule(1800, () => setActiveStage(1));
    schedule(3600, () => {
      setExecutionStep(0);
      setActiveStage(2);
    });
    schedule(4250, () => setExecutionStep(1));
    schedule(4900, () => setExecutionStep(2));
    schedule(5550, () => setExecutionStep(3));
    schedule(6350, () => setActiveStage(3));
    schedule(9200, () => setIsPlaying(false));
  }, [clearTimers]);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!motionPreference.matches) {
      autoStartTimerRef.current = window.setTimeout(replay, 650);
    }

    function handleMotionPreferenceChange(event: MediaQueryListEvent) {
      if (!event.matches) return;
      if (autoStartTimerRef.current !== null) {
        window.clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
      clearTimers();
      setActiveStage(3);
      setExecutionStep(3);
      setIsPlaying(false);
    }

    motionPreference.addEventListener("change", handleMotionPreferenceChange);
    return () => {
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
      if (autoStartTimerRef.current !== null) {
        window.clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
      clearTimers();
    };
  }, [clearTimers, replay]);

  function selectStage(index: number) {
    if (autoStartTimerRef.current !== null) {
      window.clearTimeout(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }
    clearTimers();
    setIsPlaying(false);
    setActiveStage(index);
    setExecutionStep(
      index === 2 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 2
        : index === 2
          ? DEMO_STEPS.length
          : 0
    );
  }

  const stage = STAGES[activeStage];

  return (
    <section
      aria-label="Animated FlowPilot workflow demonstration"
      className="flow-demo"
      data-stage={activeStage}
      data-playing={isPlaying}
    >
      <div className="flow-demo-window">
        <div className="flow-demo-windowbar">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flow-demo-mark" aria-hidden="true">F</span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-white">FlowPilot workspace</p>
              <p className="truncate text-[10px] text-white/45">Workflow preview · onboarding follow-up</p>
            </div>
          </div>
          <span className="flow-demo-simulation">
            <span aria-hidden="true" />
            Simulated run
          </span>
        </div>

        <div className="flow-demo-content">
          <div className="flow-demo-heading">
            <div className="min-w-0">
              <p className="flow-demo-kicker">PRODUCT TOUR <span>·</span> 4 STAGES</p>
              <h2>{stage.title}</h2>
              <p className="flow-demo-description">{stage.description}</p>
            </div>
            <span className="flow-demo-stage-number" aria-hidden="true">
              0{activeStage + 1}<span> / 04</span>
            </span>
          </div>

          <div
            className="flow-demo-progress"
            role="progressbar"
            aria-label="Product tour progress"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={activeStage + 1}
          >
            <span style={{ width: `${((activeStage + 1) / STAGES.length) * 100}%` }} />
          </div>

          <div
            className="flow-demo-stage-nav"
            role="group"
            aria-label="Choose a demonstration stage"
          >
            {STAGES.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={activeStage === index}
                onClick={() => selectStage(index)}
              >
                <span>0{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div key={activeStage} className={`flow-demo-visual flow-demo-visual-${activeStage}`}>
            {activeStage === 0 && <TriggerStage />}
            {(activeStage === 1 || activeStage === 2) && (
              <WorkflowStage stage={activeStage} executionStep={executionStep} />
            )}
            {activeStage === 3 && <MonitorStage />}
          </div>

          <div className="flow-demo-controls">
            <button type="button" className="flow-demo-replay" onClick={replay}>
              <RotateCcw className={`h-3.5 w-3.5${isPlaying ? " flow-demo-spinning" : ""}`} />
              {isPlaying ? "Replay from start" : "Replay demonstration"}
            </button>
            <span className="flow-demo-note">Sample data · no services called</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TriggerStage() {
  return (
    <div className="flow-trigger-layout">
      <div className="flow-trigger-source">
        <div className="flow-visual-label">
          <span className="flow-signal-dot" />
          INCOMING EVENT
        </div>
        <div className="flow-trigger-request">
          <span className="flow-method">POST</span>
          <span>/hooks/team/onboarding</span>
        </div>
        <div className="flow-payload">
          <span className="flow-payload-key">event</span>
          <span>team.member_added</span>
          <span className="flow-payload-key">member</span>
          <span>new teammate</span>
        </div>
        <div className="flow-trigger-footer">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Signature verified
        </div>
      </div>

      <div className="flow-trigger-connector" aria-hidden="true">
        <span />
        <ArrowRight className="h-4 w-4" />
      </div>

      <div className="flow-trigger-node">
        <div className="flow-node-icon flow-node-icon-trigger"><Zap className="h-4 w-4" /></div>
        <div>
          <p>Workflow trigger</p>
          <span>Payload mapped to context</span>
        </div>
        <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-300" />
      </div>
    </div>
  );
}

function WorkflowStage({
  stage,
  executionStep,
}: {
  stage: number;
  executionStep: number;
}) {
  return (
    <div className="flow-canvas">
      <div className="flow-canvas-toolbar">
        <div>
          <span className="flow-canvas-breadcrumb">WORKFLOWS</span>
          <span className="flow-canvas-divider">/</span>
          <span className="text-white/75">Onboarding follow-up</span>
        </div>
        <span className="flow-canvas-draft">Draft preview</span>
      </div>

      <div className="flow-node-row">
        {DEMO_STEPS.map((item, index) => {
          const Icon = item.icon;
          const isRunning = stage === 2 && executionStep === index;
          const isComplete = stage === 2 && executionStep > index;

          return (
            <div className="flow-node-wrap" key={item.id}>
              <div
                className={`flow-node${isRunning ? " is-running" : ""}${isComplete ? " is-complete" : ""}`}
                data-node={item.id}
              >
                <div className={`flow-node-icon flow-node-icon-${item.id}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flow-node-copy">
                  <span>{item.kind}</span>
                  <strong>{item.label}</strong>
                </div>
                <span className="flow-node-status">
                  {isRunning ? (
                    <span className="flow-node-processing">Running</span>
                  ) : isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-label="Complete" />
                  ) : stage === 1 ? (
                    <span>Ready</span>
                  ) : (
                    <CircleDot className="h-3.5 w-3.5 text-white/30" aria-label="Waiting" />
                  )}
                </span>
              </div>
              {index < DEMO_STEPS.length - 1 && (
                <div
                  className={`flow-node-connector${stage === 2 && executionStep > index ? " is-flowing" : ""}${isRunning ? " is-active" : ""}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flow-canvas-footer">
        <span><Clock className="h-3.5 w-3.5" /> Execution state saved between steps</span>
        {stage === 2 ? (
          <span className="flow-execution-status">
            {executionStep < DEMO_STEPS.length ? (
              <><Activity className="h-3.5 w-3.5" /> Processing</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Run complete</>
            )}
          </span>
        ) : (
          <span>3 connected steps</span>
        )}
      </div>
    </div>
  );
}

function MonitorStage() {
  return (
    <div className="flow-monitor">
      <div className="flow-monitor-summary">
        <div className="flow-monitor-run">
          <span className="flow-monitor-check"><CheckCircle2 className="h-4 w-4" /></span>
          <div>
            <strong>Run completed</strong>
            <span>Webhook · onboarding follow-up</span>
          </div>
        </div>
        <span className="flow-monitor-total">502 ms <span>total</span></span>
      </div>

      <div className="flow-monitor-table" role="table" aria-label="Simulated execution results">
        <div role="rowgroup">
          <div className="sr-only" role="row">
            <span role="columnheader">Step icon</span>
            <span role="columnheader">Step</span>
            <span role="columnheader">Result</span>
            <span role="columnheader">Duration</span>
            <span role="columnheader">Status</span>
          </div>
          {DEMO_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div className="flow-monitor-row" role="row" key={item.id}>
                <span className={`flow-monitor-icon flow-node-icon-${item.id}`} role="cell" aria-label={`${item.label} icon`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="flow-monitor-name" role="cell">{item.label}</span>
                <span className="flow-monitor-result" role="cell">{STEP_RESULTS[item.id]}</span>
                <span className="flow-monitor-duration" role="cell">{STEP_DURATIONS[item.id]}</span>
                <span className="flow-monitor-success flex h-3.5 w-3.5 items-center justify-center" role="cell" aria-label="Complete">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flow-monitor-output">
        <span>FINAL OUTPUT</span>
        <code>{"{ status: 'welcome_sent', runId: 'demo-4821' }"}</code>
      </div>
    </div>
  );
}
