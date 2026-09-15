import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useInvitationFlow } from "./state/useInvitationFlow";
import { OpeningScreen } from "./screens/OpeningScreen";
import { CelebrationScreen } from "./screens/CelebrationScreen";
import { PlanningScreen } from "./screens/PlanningScreen";
import { ConfirmationScreen } from "./screens/ConfirmationScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { NoPopupSequence } from "./components/NoPopupSequence";
import { PetalsLayer } from "./components/Decorations";

export default function App() {
  const flow = useInvitationFlow();

  // reset scroll between steps (mobile nicety)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [flow.step]);

  return (
    <div className="grain relative min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-paper focus:px-4 focus:py-2 focus:shadow-lift"
      >
        skip to content
      </a>

      <PetalsLayer count={12} />

      <main id="main-content">
        <AnimatePresence mode="wait">
          {flow.step === "opening" && (
            <OpeningScreen
              key="opening"
              onYes={flow.sayYes}
              onNo={flow.sayNo}
              onPick={flow.pickFlower}
              pickedIds={flow.pickedIds}
              pickedFlowers={flow.pickedFlowers}
            />
          )}
          {flow.step === "celebration" && (
            <CelebrationScreen key="celebration" onContinue={() => flow.setStep("planning")} />
          )}
          {flow.step === "planning" && (
            <PlanningScreen
              key="planning"
              selectedDate={flow.selectedDate}
              selectedTime={flow.selectedTime}
              selectedActivityId={flow.selectedActivityId}
              onSelectDate={flow.setSelectedDate}
              onSelectTime={flow.setSelectedTime}
              onSelectActivity={flow.setSelectedActivityId}
              onConfirm={flow.goToConfirm}
            />
          )}
          {flow.step === "confirming" && flow.selectedDate && flow.selectedTime && (
            <ConfirmationScreen
              key="confirming"
              selectedDate={flow.selectedDate}
              selectedTime={flow.selectedTime}
              selectedActivityId={flow.selectedActivityId}
              submitting={flow.submitting}
              submitError={flow.submitError}
              onConfirm={() =>
                flow.confirm({ requestCalendar: true, requestEmail: true })
              }
              onEdit={flow.backToPlanning}
            />
          )}
          {flow.step === "final" && flow.selectedDate && flow.selectedTime && (
            <FinalScreen
              key="final"
              result={flow.result}
              selectedDate={flow.selectedDate}
              selectedTime={flow.selectedTime}
              selectedActivityId={flow.selectedActivityId}
              pickedFlowers={flow.pickedFlowers}
            />
          )}
        </AnimatePresence>
      </main>

      {/* the NO negotiation — every click brings the next plea; YES always works */}
      {flow.noOpen && (
        <NoPopupSequence stage={flow.noStage} onInsist={flow.insistNo} onYes={flow.giveIn} onClose={flow.closeNoPopup} />
      )}
    </div>
  );
}
