package com.futureballer.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Envoltorio nativo de Future Baller: un WebView a pantalla completa sobre la
 * web de Railway. Incluye barra de progreso, pantalla de sin conexión, subida de
 * archivos (foto/portada/documentos) y navegación atrás del sistema.
 */
public class MainActivity extends Activity {

    private static final String START_URL = BuildConfig.APP_URL;
    private static final String HOST = Uri.parse(START_URL).getHost();
    private static final int FILE_CHOOSER_REQUEST = 1001;

    /**
     * Dominios que pueden aparecer durante el OAuth de Google (incluye
     * verificación en dos pasos, enlaces cortos y dominios regionales).
     */
    private static final String[] GOOGLE_AUTH_SUFFIXES = {
            ".google.com",
            ".gstatic.com",
            ".googleusercontent.com",
            ".googleapis.com",
            ".ggpht.com",
            ".youtube.com",
            ".g.co",
            ".goo.gl",
            ".recaptcha.net"
    };

    private static boolean isGoogleAuthHost(String host) {
        if (host == null) return false;
        String lower = host.toLowerCase();
        if ("google.com".equals(lower) || "gstatic.com".equals(lower)) return true;
        // google.es, google.co.uk, google.de… (cualquier Google regional).
        if (lower.matches("(^|\\.)google\\.[a-z]{2,3}(\\.[a-z]{2})?$")) return true;
        for (String suffix : GOOGLE_AUTH_SUFFIXES) {
            if (lower.endsWith(suffix)) return true;
        }
        return false;
    }

    /** Páginas de la app en las que cualquier navegación debe quedarse dentro. */
    private static boolean isAuthPath(String path) {
        return path.startsWith("/login")
                || path.startsWith("/register")
                || path.startsWith("/forgot-password")
                || path.startsWith("/reset-password")
                || path.startsWith("/verify-email")
                || path.startsWith("/welcome");
    }

    /**
     * Mientras es `true`, cualquier navegación http(s) se queda en el WebView.
     * Se activa al entrar en un dominio de Google y se apaga al volver al nuestro:
     * así ningún paso intermedio (verificación, enlaces cortos, dominios
     * regionales) se escapa al navegador externo y pierde la sesión.
     */
    private boolean authInProgress = true;

    private WebView webView;
    private ProgressBar progress;
    private LinearLayout offline;
    private ValueCallback<Uri[]> filePathCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#11151B"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#11151B"));
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // Google bloquea el OAuth cuando el UA del WebView lleva "; wv". Se
        // elimina ese token (y "Version/4.0") para que la petición se vea como
        // un Chrome móvil normal: así el botón de Google funciona dentro de la app.
        String userAgent = settings.getUserAgentString();
        if (userAgent != null && userAgent.contains("wv")) {
            userAgent = userAgent.replace("; wv", "").replace("Version/4.0 ", "");
        }
        settings.setUserAgentString(userAgent);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                if (url != null && HOST != null && url.contains(HOST)) {
                    String path = Uri.parse(url).getPath();
                    authInProgress = path != null && isAuthPath(path);
                }
                // Red de seguridad: si Google rechaza el WebView, se vuelve al
                // login con un aviso en vez de dejar al usuario en su error.
                if (url != null && url.contains("accounts.google.com")) {
                    view.evaluateJavascript(
                            "(function(){var t=document.body?document.body.innerText:'';" +
                                    "return t.indexOf('disallowed_useragent')>=0" +
                                    "||t.indexOf('may not be secure')>=0" +
                                    "||t.indexOf('Access blocked')>=0;})()",
                            value -> {
                                if ("true".equals(value)) {
                                    Toast.makeText(MainActivity.this, R.string.google_blocked,
                                            Toast.LENGTH_LONG).show();
                                    view.loadUrl(START_URL);
                                }
                            });
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    offline.setVisibility(View.VISIBLE);
                    progress.setVisibility(View.GONE);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progress.setVisibility(View.VISIBLE);
                    progress.setProgress(newProgress);
                } else {
                    progress.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException error) {
                    filePathCallback = null;
                    return false;
                }
            }
        });

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(ColorStateList.valueOf(Color.parseColor("#C5F447")));
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3));
        progressParams.gravity = Gravity.TOP;
        progress.setLayoutParams(progressParams);

        offline = buildOfflineView();

        root.addView(webView);
        root.addView(progress);
        root.addView(offline);
        setContentView(root);

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    /** Dentro de la app solo el dominio propio y enlaces http(s); el resto, fuera. */
    private boolean handleUrl(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();

        boolean isWeb = "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme);
        if (isWeb && HOST != null && HOST.equalsIgnoreCase(host)) {
            String path = uri.getPath() == null ? "" : uri.getPath();
            // La app no muestra la landing: la raíz del sitio lleva al login.
            if (path.isEmpty() || "/".equals(path)) {
                authInProgress = true;
                webView.loadUrl(START_URL);
                return true;
            }
            // El WebView no pinta PDFs ni instala APKs: se abren con otra app.
            if (path.endsWith(".pdf") || path.endsWith(".apk")) {
                openExternal(uri);
                return true;
            }
            // En login/registro/verificación no se sale a ningún sitio.
            authInProgress = isAuthPath(path);
            return false;
        }

        // OAuth de Google y cualquier paso intermedio (verificación en dos pasos,
        // enlaces cortos, dominios regionales): se queda en el WebView. Mientras
        // dura el flujo de autenticación no se abre el navegador con nada.
        if (isWeb && (authInProgress || isGoogleAuthHost(host))) {
            authInProgress = true;
            return false;
        }

        openExternal(uri);
        return true;
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            // Sin app que abra el enlace: se ignora.
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private LinearLayout buildOfflineView() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(dp(32), dp(32), dp(32), dp(32));
        layout.setBackgroundColor(Color.parseColor("#11151B"));
        layout.setVisibility(View.GONE);
        layout.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        TextView title = new TextView(this);
        title.setText(R.string.offline_title);
        title.setTextColor(Color.WHITE);
        title.setTextSize(22);
        title.setGravity(Gravity.CENTER);

        TextView body = new TextView(this);
        body.setText(R.string.offline_body);
        body.setTextColor(Color.parseColor("#9AA3AF"));
        body.setTextSize(15);
        body.setGravity(Gravity.CENTER);
        body.setPadding(0, dp(8), 0, dp(24));

        Button retry = new Button(this);
        retry.setText(R.string.offline_retry);
        retry.setBackgroundColor(Color.parseColor("#C5F447"));
        retry.setTextColor(Color.parseColor("#11151B"));
        retry.setOnClickListener(view -> {
            offline.setVisibility(View.GONE);
            webView.reload();
        });

        layout.addView(title);
        layout.addView(body);
        layout.addView(retry);
        return layout;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
