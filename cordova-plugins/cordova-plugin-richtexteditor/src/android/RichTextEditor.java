/**
 * An Rich Text Editor for Cordova/PhoneGap.
 */
package com.actiontec.tiegushi;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.ArrayList;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import jp.wasabeef.richeditor.RichEditorActivity;

public class RichTextEditor extends CordovaPlugin {
	public static String TAG = "RichTextEditor";

	private CallbackContext callbackContext;
	private JSONObject params;

	public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
		this.callbackContext = callbackContext;
		this.params = args.getJSONObject(0);
		if (action.equals("edit")) {
			Intent intent = new Intent(cordova.getActivity(), RichEditorActivity.class);
			String content = "";
			if (this.params.has("html")) {
				content = this.params.getString("html");
			}
            if (content == null)
                content = "";
			intent.putExtra("CONTENT_PARAM", content);
			if (this.cordova != null) {
				this.cordova.startActivityForResult((CordovaPlugin) this, intent, 0);
			}
		}
		return true;
	}

	public void onActivityResult(int requestCode, int resultCode, Intent data) {
	   if (resultCode == Activity.RESULT_OK && data != null) {
            try {
                String content = data.getStringExtra("html");
          			JSONObject res = new JSONObject();
                res.put("html", content);
                res.put("text", content);
          			this.callbackContext.success(res);
            }
            catch (JSONException ex) {
                this.callbackContext.error("exception");
            }
		} else if (resultCode == Activity.RESULT_CANCELED) {
			this.callbackContext.error("canceled");
		} else {
			this.callbackContext.error("error");
		}
	}
}
