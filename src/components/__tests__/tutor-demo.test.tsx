import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TutorDemo } from "@/components/tutor-demo";

type Stage = "recall_formula" | "substitute_values" | "calculate" | "complete";

const sessionFor = (stage: Stage) => ({
  taskId: "trapezoid-area-1" as const,
  conceptId: "trapez-id",
  stage,
  hintLevel: 0 as const
});

const tutorResponse = (reply: string, stage: Stage, ruleName: Stage) => ({
  reply,
  session: sessionFor(stage),
  reviewStatus: "draft",
  trace: {
    intent: "formula",
    conceptName: "Pole trapezu",
    atomType: "formula",
    ruleName
  }
});

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TutorDemo", () => {
  it("guides the learner through the real four-call walkthrough", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Jaki jest wzór na pole trapezu?",
            "recall_formula",
            "recall_formula"
          )
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Dobrze. Jakie wartości podstawisz za a, b i h?",
            "substitute_values",
            "recall_formula"
          )
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Dobrze. Jaki wynik otrzymasz po obliczeniu?",
            "calculate",
            "substitute_values"
          )
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Świetnie, wynik jest poprawny.",
            "complete",
            "calculate"
          )
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TutorDemo />);

    expect(
      screen.getByText(
        "Trapez ma podstawy długości 6 cm i 10 cm oraz wysokość 4 cm. Oblicz jego pole."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Trapez z podstawami 6 cm i 10 cm oraz wysokością 4 cm"
      })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rozpocznij demo" }));

    expect(await screen.findByText("Jaki jest wzór na pole trapezu?")).toHaveFocus();
    expect(screen.getAllByText("DEV/UNREVIEWED").length).toBeGreaterThan(0);
    expect(screen.getByText("Luna: formula · trapez")).toBeInTheDocument();
    expect(screen.getByText("OKF: trapez · formula · DEV/UNREVIEWED")).toBeInTheDocument();
    expect(
      screen.getByText("Reguła deterministyczna: recall_formula")
    ).toBeInTheDocument();
    expect(screen.queryByText(/32/)).not.toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: "Twoja odpowiedź" });
    const submit = screen.getByRole("button", { name: "Wyślij odpowiedź" });

    fireEvent.click(screen.getByRole("button", { name: "P=(a+b)*h/2" }));
    expect(input).toHaveValue("P=(a+b)*h/2");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(submit);
    expect(await screen.findByText("Jakie wartości podstawisz za a, b i h?")).toHaveFocus();
    expect(screen.queryByText(/32/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "(6+10)*4/2" }));
    expect(input).toHaveValue("(6+10)*4/2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fireEvent.click(submit);
    expect(await screen.findByText("Wykonaj teraz obliczenie.")).toHaveFocus();
    expect(screen.queryByText(/32/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "___ cm²" }));
    expect(input).toHaveValue("___ cm²");
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fireEvent.change(input, { target: { value: "32 cm²" } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(
      await screen.findByText("Dobrze — samodzielnie rozwiązałeś zadanie.")
    ).toHaveFocus();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/tutor",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "start",
          message: "Chcę obliczyć pole trapezu"
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/tutor",
      expect.objectContaining({
        body: JSON.stringify({
          action: "answer",
          message: "P=(a+b)*h/2",
          session: sessionFor("recall_formula")
        })
      })
    );
  });

  it("does not reveal the final result in an incorrect-formula reply", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Jaki jest wzór na pole trapezu?",
            "recall_formula",
            "recall_formula"
          )
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Czy możesz jeszcze raz zapisać wzór na pole trapezu?",
            "recall_formula",
            "recall_formula"
          )
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TutorDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Rozpocznij demo" }));
    await screen.findByText("Jaki jest wzór na pole trapezu?");

    fireEvent.change(screen.getByRole("textbox", { name: "Twoja odpowiedź" }), {
      target: { value: "P=a*b" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Wyślij odpowiedź" }));

    const reply = await screen.findByText(
      "Czy możesz jeszcze raz zapisać wzór na pole trapezu?"
    );
    expect(within(reply).queryByText(/32/)).not.toBeInTheDocument();
    expect(screen.getByText("Etap 1 z 3")).toBeInTheDocument();
  });

  it("blocks duplicate starts while loading and focuses the newest tutor message", async () => {
    let resolveStart!: (response: Response) => void;
    const pendingStart = new Promise<Response>((resolve) => {
      resolveStart = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>().mockReturnValueOnce(pendingStart);
    vi.stubGlobal("fetch", fetchMock);

    render(<TutorDemo />);
    const start = screen.getByRole("button", { name: "Rozpocznij demo" });
    fireEvent.click(start);

    expect(start).toBeDisabled();
    fireEvent.click(start);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveStart(
      jsonResponse(
        tutorResponse(
          "Jaki jest wzór na pole trapezu?",
          "recall_formula",
          "recall_formula"
        )
      )
    );
    expect(await screen.findByText("Jaki jest wzór na pole trapezu?")).toHaveFocus();
  });

  it("shows a generic error and lets the learner retry", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("private-upstream-detail"))
      .mockResolvedValueOnce(
        jsonResponse(
          tutorResponse(
            "Jaki jest wzór na pole trapezu?",
            "recall_formula",
            "recall_formula"
          )
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<TutorDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Rozpocznij demo" }));

    expect(
      await screen.findByText("Nie udało się połączyć z tutorem. Spróbuj ponownie.")
    ).toBeInTheDocument();
    expect(screen.queryByText("private-upstream-detail")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rozpocznij demo" }));
    expect(await screen.findByText("Jaki jest wzór na pole trapezu?")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
