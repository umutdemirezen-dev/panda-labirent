package com.pandagames.labirent;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Android WebView'da window.speechSynthesis olmadığı için Türkçe seslendirmeyi
 * Android'in kendi TextToSpeech motoruyla yapan küçük yerel eklenti.
 *
 * JS:  Capacitor.Plugins.TextToSpeech.speak({ text, lang, rate, pitch })  → konuşma BİTİNCE çözülür
 *      Capacitor.Plugins.TextToSpeech.stop()
 */
@CapacitorPlugin(name = "TextToSpeech")
public class PandaTtsPlugin extends Plugin {

    private TextToSpeech tts;
    private boolean ready = false;
    private PluginCall waitingCall = null;               // motor hazır olmadan gelen ilk istek
    private final Map<String, PluginCall> pending = new HashMap<>();

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.forLanguageTag("tr-TR"));
                ready = true;
                PluginCall c = waitingCall;
                waitingCall = null;
                if (c != null) {
                    doSpeak(c);
                }
            } else if (waitingCall != null) {
                waitingCall.resolve();
                waitingCall = null;
            }
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) { }

            @Override
            public void onDone(String utteranceId) { finish(utteranceId); }

            @Override
            public void onError(String utteranceId) { finish(utteranceId); }

            @Override
            public void onStop(String utteranceId, boolean interrupted) { finish(utteranceId); }
        });
    }

    private synchronized void finish(String id) {
        PluginCall call = pending.remove(id);
        if (call != null) {
            call.resolve();
        }
    }

    private synchronized void finishAll() {
        for (PluginCall call : pending.values()) {
            call.resolve();
        }
        pending.clear();
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (!ready) {
            if (waitingCall != null) {
                waitingCall.resolve();
            }
            waitingCall = call;
            return;
        }
        doSpeak(call);
    }

    private void doSpeak(PluginCall call) {
        String text = call.getString("text", "");
        if (tts == null || text == null || text.isEmpty()) {
            call.resolve();
            return;
        }
        String lang = call.getString("lang", "tr-TR");
        Float rate = call.getFloat("rate", 1.0f);
        Float pitch = call.getFloat("pitch", 1.0f);
        tts.setLanguage(Locale.forLanguageTag(lang));
        tts.setSpeechRate(rate != null ? rate : 1.0f);
        tts.setPitch(pitch != null ? pitch : 1.0f);

        String id = UUID.randomUUID().toString();
        synchronized (this) {
            pending.put(id, call);
        }
        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
        if (result != TextToSpeech.SUCCESS) {
            finish(id);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) {
            tts.stop();
        }
        if (waitingCall != null) {
            waitingCall.resolve();
            waitingCall = null;
        }
        finishAll();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        finishAll();
    }
}
