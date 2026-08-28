'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type RecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};

type RecognitionEventLike = {
  results: ArrayLike<RecognitionResultLike>;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;

type VoiceWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

export function useBrowserVoice() {
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [speechInputSupported, setSpeechInputSupported] = useState(false);
  const [speechOutputSupported, setSpeechOutputSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const voiceWindow = window as VoiceWindow;
    setSpeechInputSupported(Boolean(voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition));
    setSpeechOutputSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback((onTranscript: (text: string) => void) => {
    if (typeof window === 'undefined') return;
    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? '';
      }
      if (transcript.trim()) onTranscript(transcript.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.96;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith('pt-br'))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  return {
    listening,
    speechInputSupported,
    speechOutputSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
