package com.shrikalyan.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Launches a UPI app through the standard upi://pay intent and hands the app's
 * result string (txnId=..&responseCode=..&Status=SUCCESS&txnRef=..) back to JS.
 */
@CapacitorPlugin(name = "UpiPay")
public class UpiPayPlugin extends Plugin {

    @PluginMethod
    public void pay(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null || uri.isEmpty()) {
            call.reject("Missing UPI uri");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
        String pkg = call.getString("package");
        if (pkg != null && !pkg.isEmpty()) intent.setPackage(pkg);

        try {
            startActivityForResult(call, intent, "handlePayResult");
        } catch (ActivityNotFoundException e) {
            call.reject("UPI app is not installed on this phone", "NO_APP");
        }
    }

    @ActivityCallback
    private void handlePayResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        String response = "";
        if (data != null) {
            String r = data.getStringExtra("response");
            if (r == null) {
                // Some apps put the fields as individual extras instead of one query string.
                Bundle extras = data.getExtras();
                if (extras != null) {
                    StringBuilder sb = new StringBuilder();
                    for (String key : extras.keySet()) {
                        Object v = extras.get(key);
                        if (v != null) sb.append(key).append('=').append(v).append('&');
                    }
                    r = sb.toString();
                }
            }
            if (r != null) response = r;
        }
        JSObject ret = new JSObject();
        ret.put("response", response);
        ret.put("resultCode", result.getResultCode());
        call.resolve(ret);
    }
}
