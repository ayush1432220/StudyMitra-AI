import React from "react";
import {
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  FileText,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user);
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} />
            AI STUDY WORKSPACE
          </div>

          <h1>Good to see you, {firstName}.</h1>

          <p>
            Turn your notes into understanding with one intelligent
            academic workspace.
          </p>
        </div>

        <Link className="primary-button" to="/chat">
          <MessageSquareText size={17} />
          Ask StudyMitra AI
        </Link>
      </section>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-chip">
            RAG-POWERED LEARNING
          </span>

          <h2>
            Ask questions.
            <br />
            <span>Get grounded answers.</span>
          </h2>

          <p>
            Upload your study material, then ask StudyMitra AI questions
            that stay connected to your sources.
          </p>

          <Link className="hero-action" to="/documents">
            Add a document
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="hero-orbit">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="hero-core">
            <BrainCircuit size={42} />
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <span className="section-kicker">
            QUICK START
          </span>

          <h2>Everything you need to study</h2>
        </div>
      </div>

      <section className="feature-grid">
        <Link
          to="/chat"
          className="feature-card feature-primary"
        >
          <div className="feature-icon">
            <MessageSquareText size={20} />
          </div>

          <h3>AI Assistant</h3>

          <p>
            Ask concepts, solve doubts and get explanations in
            simple language.
          </p>

          <span>
            Start a conversation
            <ArrowUpRight size={15} />
          </span>
        </Link>

        <Link
          to="/documents"
          className="feature-card"
        >
          <div className="feature-icon">
            <FileText size={20} />
          </div>

          <h3>Study Library</h3>

          <p>
            Keep your PDFs, notes and reference material organized
            in one place.
          </p>

          <span>
            Manage documents
            <ArrowUpRight size={15} />
          </span>
        </Link>

        <div className="feature-card">
          <div className="feature-icon">
            <BookOpen size={20} />
          </div>

          <h3>Source-grounded</h3>

          <p>
            Use retrieval-augmented generation to connect responses
            with your material.
          </p>

          <span>RAG workflow</span>
        </div>
      </section>
    </div>
  );
}