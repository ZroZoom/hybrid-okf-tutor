"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { TaskCard } from "@/components/task-card";
import { TracePanel } from "@/components/trace-panel";

type TutorStage = "recall_formula" | "substitute_values" | "calculate" | "complete";

type TutorSession = {
  taskId: "trapezoid-area-1";
  conceptId: string;
  stage: TutorStage;
  hintLevel: 0 | 1;
};

type TutorTrace = {
  intent: string;
  conceptName: string | null;
  atomType: string | null;
  ruleName: string;
};

type ReviewStatus = "draft" | "pending" | "approved" | "published";

type TutorResponse = {
  reply: string;
  session: TutorSession | null;
  reviewStatus: ReviewStatus | null;
  trace: TutorTrace;
};

type ConversationMessage = {
  id: number;
  role: "student" | "tutor";
  content: string;
};

const QUICK_ANSWERS: Partial<Record<TutorStage, string>> = {
  recall_formula: "P=(a+b)*h/2",
  substitute_values: "(6+10)*4/2",
  calculate: "32 cm²"
};

const GENERIC_ERROR = "Nie udało się połączyć z tutorem. Spróbuj ponownie.";

const presentReply = (response: TutorResponse): string => {
  if (
    response.session?.stage === "substitute_values" &&
    response.reply === "Dobrze. Jakie wartości podstawisz za a, b i h?"
  ) {
    return "Jakie wartości podstawisz za a, b i h?";
  }

  if (
    response.session?.stage === "calculate" &&
    response.reply === "Dobrze. Jaki wynik otrzymasz po obliczeniu?"
  ) {
    return "Wykonaj teraz obliczenie.";
  }

  if (
    response.session?.stage === "complete" &&
    response.reply === "Świetnie, wynik jest poprawny."
  ) {
    return "Dobrze — samodzielnie rozwiązałeś zadanie.";
  }

  return response.reply;
};

const stagePosition = (stage: TutorStage): number => {
  if (stage === "recall_formula") return 1;
  if (stage === "substitute_values") return 2;
  return 3;
};

export function TutorDemo() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [session, setSession] = useState<TutorSession | null>(null);
  const [trace, setTrace] = useState<TutorTrace | null>(null);
  const [isUnreviewed, setIsUnreviewed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const requestInFlight = useRef(false);
  const nextMessageId = useRef(0);
  const newestTutorMessage = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    newestTutorMessage.current?.focus();
  }, [messages]);

  const message = (role: ConversationMessage["role"], content: string) => ({
    id: nextMessageId.current++,
    role,
    content
  });

  const requestTutor = async (body: object): Promise<TutorResponse> => {
    const response = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("Tutor request failed");
    return (await response.json()) as TutorResponse;
  };

  const beginRequest = (): boolean => {
    if (requestInFlight.current) return false;
    requestInFlight.current = true;
    setIsLoading(true);
    setError(null);
    return true;
  };

  const finishRequest = () => {
    requestInFlight.current = false;
    setIsLoading(false);
  };

  const applyResponse = (response: TutorResponse) => {
    setSession(response.session);
    setTrace(response.trace);
    setIsUnreviewed(
      response.reviewStatus === "draft" || response.reviewStatus === "pending"
    );
  };

  const startDemo = async () => {
    if (hasStarted || !beginRequest()) return;

    try {
      const response = await requestTutor({
        action: "start",
        message: "Chcę obliczyć pole trapezu"
      });
      applyResponse(response);
      setMessages([message("tutor", presentReply(response))]);
      setHasStarted(true);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      finishRequest();
    }
  };

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const answer = input.trim();
    if (!session || !answer || session.stage === "complete" || !beginRequest()) return;

    try {
      const response = await requestTutor({
        action: "answer",
        message: answer,
        session
      });
      applyResponse(response);
      setMessages((current) => [
        ...current,
        message("student", answer),
        message("tutor", presentReply(response))
      ]);
      setInput("");
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      finishRequest();
    }
  };

  const quickAnswer = session ? QUICK_ANSWERS[session.stage] : undefined;
  const walkthroughComplete = session?.stage === "complete";

  return (
    <main className="demo-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Hybrid OKF Tutor</p>
          <h1>Policz sam. Tutor poprowadzi Cię krok po kroku.</h1>
          <p className="hero-copy">
            Krótkie demo pokazuje, jak Luna rozumie odpowiedź, OKF dostarcza wiedzę,
            a reguły pilnują rozwiązania.
          </p>
        </div>
        <button
          className="primary-button start-button"
          type="button"
          onClick={startDemo}
          disabled={isLoading || hasStarted}
        >
          Rozpocznij demo
        </button>
      </header>

      <div className="demo-grid">
        <div className="context-column">
          <TaskCard isUnreviewed={isUnreviewed} />
          <TracePanel trace={trace} isUnreviewed={isUnreviewed} />
        </div>

        <section className="conversation-card" aria-labelledby="conversation-heading">
          <div className="conversation-heading">
            <div>
              <p className="eyebrow">Rozmowa</p>
              <h2 id="conversation-heading">Twoje rozwiązanie</h2>
            </div>
            <span className="step-label">
              {session ? `Etap ${stagePosition(session.stage)} z 3` : "3 krótkie kroki"}
            </span>
          </div>

          <div className="conversation" aria-live="polite" aria-busy={isLoading}>
            {messages.length === 0 ? (
              <div className="empty-conversation">
                <span aria-hidden="true">∴</span>
                <p>Uruchom demo, aby zacząć od wzoru.</p>
              </div>
            ) : (
              messages.map((item, index) => {
                const isNewestTutor = item.role === "tutor" && index === messages.length - 1;
                return (
                  <div className={`message-row ${item.role}`} key={item.id}>
                    <span className="message-author">
                      {item.role === "tutor" ? "Tutor" : "Ty"}
                    </span>
                    <p
                      className="message-bubble"
                      ref={isNewestTutor ? newestTutorMessage : undefined}
                      tabIndex={isNewestTutor ? -1 : undefined}
                    >
                      {item.content}
                    </p>
                  </div>
                );
              })
            )}
            {isLoading ? <p className="loading-message">Tutor sprawdza odpowiedź…</p> : null}
          </div>

          {error ? (
            <p className="error-message" role="alert">
              {error}
            </p>
          ) : null}

          <form className="answer-form" onSubmit={submitAnswer}>
            <label htmlFor="student-answer">Twoja odpowiedź</label>
            <div className="answer-row">
              <input
                id="student-answer"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={hasStarted ? "Zapisz kolejny krok" : "Najpierw rozpocznij demo"}
                disabled={!session || isLoading || walkthroughComplete}
                autoComplete="off"
              />
              <button
                className="primary-button"
                type="submit"
                disabled={!session || !input.trim() || isLoading || walkthroughComplete}
              >
                Wyślij odpowiedź
              </button>
            </div>

            {quickAnswer ? (
              <div className="quick-answers" aria-label="Szybka odpowiedź">
                <span>Wypełnij przykładem:</span>
                <button type="button" onClick={() => setInput(quickAnswer)} disabled={isLoading}>
                  {quickAnswer}
                </button>
              </div>
            ) : walkthroughComplete ? (
              <p className="completion-note">Zadanie ukończone — wynik został sprawdzony.</p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
