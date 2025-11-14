import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resume_Help" },
    { name: "description", content: "Smart feedback for your dream job!!" },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
          <div className="page-heading">
              <h1>Track Your Applications & Resume Ratings</h1>
              <h2>Review Your Submission and check AI-powered feedback.</h2>
          </div>
      </section>

  </main>;
}
