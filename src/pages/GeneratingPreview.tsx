import { CourseGeneratingScreen } from "@/components/courses/CourseGeneratingScreen";

export default function GeneratingPreview() {
  return (
    <CourseGeneratingScreen
      topic="Behavioral Economics"
      isVisible={true}
      courseTitle="Behavioral Economics: How People Really Decide"
      expectedModules={[
        { index: 0, title: "Why Rational Choice Fails" },
        { index: 1, title: "Anchoring & Framing Effects" },
        { index: 2, title: "Loss Aversion in Action" },
        { index: 3, title: "Nudges & Choice Architecture" },
        { index: 4, title: "Designing Better Decisions" },
      ]}
    />
  );
}