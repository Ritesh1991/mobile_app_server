package org.wordpress.android.editor;

import android.app.Fragment;
import android.content.Intent;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.ContextMenu;
import android.view.DragEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

import org.wordpress.android.util.helpers.MediaFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class HotShareEditorActivity extends AppCompatActivity implements EditorFragmentAbstract.EditorFragmentListener,
        EditorFragmentAbstract.EditorDragAndDropListener {

    public static final String EDITOR_PARAM = "EDITOR_PARAM";
    public static final String TITLE_PARAM = "TITLE_PARAM";
    public static final String CONTENT_PARAM = "CONTENT_PARAM";
    public static final String DRAFT_PARAM = "DRAFT_PARAM";
    public static final String TITLE_PLACEHOLDER_PARAM = "TITLE_PLACEHOLDER_PARAM";
    public static final String CONTENT_PLACEHOLDER_PARAM = "CONTENT_PLACEHOLDER_PARAM";

    public static final int ADD_MEDIA_ACTIVITY_REQUEST_CODE = 1111;
    public static final int ADD_MEDIA_FAIL_ACTIVITY_REQUEST_CODE = 1112;
    public static final int ADD_MEDIA_SLOW_NETWORK_REQUEST_CODE = 1113;

    public static final String MEDIA_REMOTE_ID_SAMPLE = "123";

    private static final int SELECT_IMAGE_MENU_POSITION = 0;
    private static final int SELECT_IMAGE_FAIL_MENU_POSITION = 1;
    private static final int SELECT_VIDEO_MENU_POSITION = 2;
    private static final int SELECT_VIDEO_FAIL_MENU_POSITION = 3;
    private static final int SELECT_IMAGE_SLOW_MENU_POSITION = 4;

    private EditorFragmentAbstract mEditorFragment;

    private Map<String, String> mFailedUploads;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_hot_share_editor);

        mFailedUploads = new HashMap<>();
    }

    @Override
    public void onAttachFragment(Fragment fragment) {
        super.onAttachFragment(fragment);
        if (fragment instanceof EditorFragmentAbstract) {
            mEditorFragment = (EditorFragmentAbstract) fragment;
        }
    }

    @Override
    public void onBackPressed() {
        Fragment fragment =  getFragmentManager()
                .findFragmentByTag(ImageSettingsDialogFragment.IMAGE_SETTINGS_DIALOG_TAG);
        if (fragment != null && fragment.isVisible()) {
            ((ImageSettingsDialogFragment) fragment).dismissFragment();
        } else {
            try {
                Intent data = new Intent();
                Bundle res = new Bundle();
                res.putCharSequence("html", mEditorFragment.getContent());
                data.putExtras(res);
                setResult(RESULT_OK, data);
            } catch (EditorFragment.IllegalEditorStateException e) {
                e.printStackTrace();
            }
            super.onBackPressed();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_action_bar, menu);
        return true;
    }

    @Override
    public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
        menu.add(0, SELECT_IMAGE_MENU_POSITION, 0, getString(R.string.select_image));
        menu.add(0, SELECT_IMAGE_FAIL_MENU_POSITION, 0, getString(R.string.select_image_fail));
        menu.add(0, SELECT_VIDEO_MENU_POSITION, 0, getString(R.string.select_video));
        menu.add(0, SELECT_VIDEO_FAIL_MENU_POSITION, 0, getString(R.string.select_video_fail));
        menu.add(0, SELECT_IMAGE_SLOW_MENU_POSITION, 0, getString(R.string.select_image_slow_network));
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.item_ok) {
            try {
                Intent data = new Intent();
                Bundle res = new Bundle();
                res.putCharSequence("html", mEditorFragment.getContent());
                data.putExtras(res);
                setResult(RESULT_OK, data);
                finish();
            } catch (EditorFragment.IllegalEditorStateException e) {
                e.printStackTrace();
            }
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public boolean onContextItemSelected(MenuItem item) {
        Intent intent = new Intent(Intent.ACTION_PICK);

        switch (item.getItemId()) {
            case SELECT_IMAGE_MENU_POSITION:
                intent.setType("image/*");
                intent.setAction(Intent.ACTION_GET_CONTENT);
                intent = Intent.createChooser(intent, getString(R.string.select_image));

                startActivityForResult(intent, ADD_MEDIA_ACTIVITY_REQUEST_CODE);
                return true;
            case SELECT_IMAGE_FAIL_MENU_POSITION:
                intent.setType("image/*");
                intent.setAction(Intent.ACTION_GET_CONTENT);
                intent = Intent.createChooser(intent, getString(R.string.select_image_fail));

                startActivityForResult(intent, ADD_MEDIA_FAIL_ACTIVITY_REQUEST_CODE);
                return true;
            case SELECT_VIDEO_MENU_POSITION:
                intent.setType("video/*");
                intent.setAction(Intent.ACTION_GET_CONTENT);
                intent = Intent.createChooser(intent, getString(R.string.select_video));

                startActivityForResult(intent, ADD_MEDIA_ACTIVITY_REQUEST_CODE);
                return true;
            case SELECT_VIDEO_FAIL_MENU_POSITION:
                intent.setType("video/*");
                intent.setAction(Intent.ACTION_GET_CONTENT);
                intent = Intent.createChooser(intent, getString(R.string.select_video_fail));

                startActivityForResult(intent, ADD_MEDIA_FAIL_ACTIVITY_REQUEST_CODE);
                return true;
            case SELECT_IMAGE_SLOW_MENU_POSITION:
                intent.setType("image/*");
                intent.setAction(Intent.ACTION_GET_CONTENT);
                intent = Intent.createChooser(intent, getString(R.string.select_image_slow_network));

                startActivityForResult(intent, ADD_MEDIA_SLOW_NETWORK_REQUEST_CODE);
                return true;
            default:
                return false;
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (data == null) {
            return;
        }

        Uri mediaUri = data.getData();

        MediaFile mediaFile = new MediaFile();
        String mediaId = String.valueOf(System.currentTimeMillis());
        mediaFile.setMediaId(mediaId);
        mediaFile.setVideo(mediaUri.toString().contains("video"));

        switch (requestCode) {
            case ADD_MEDIA_ACTIVITY_REQUEST_CODE:
                mEditorFragment.appendMediaFile(mediaFile, mediaUri.toString(), null);

                if (mEditorFragment instanceof EditorMediaUploadListener) {
                    simulateFileUpload(mediaId, mediaUri.toString());
                }
                break;
            case ADD_MEDIA_FAIL_ACTIVITY_REQUEST_CODE:
                mEditorFragment.appendMediaFile(mediaFile, mediaUri.toString(), null);

                if (mEditorFragment instanceof EditorMediaUploadListener) {
                    simulateFileUploadFail(mediaId, mediaUri.toString());
                }
                break;
            case ADD_MEDIA_SLOW_NETWORK_REQUEST_CODE:
                mEditorFragment.appendMediaFile(mediaFile, mediaUri.toString(), null);

                if (mEditorFragment instanceof EditorMediaUploadListener) {
                    simulateSlowFileUpload(mediaId, mediaUri.toString());
                }
                break;
        }
    }

    @Override
    public void onMediaDropped(ArrayList<Uri> mediaUri) {

    }

    @Override
    public void onRequestDragAndDropPermissions(DragEvent dragEvent) {

    }

    @Override
    public void onSettingsClicked() {

    }

    @Override
    public void onAddMediaClicked() {

    }

    @Override
    public void onMediaRetryClicked(String mediaId) {
        if (mFailedUploads.containsKey(mediaId)) {
            simulateFileUpload(mediaId, mFailedUploads.get(mediaId));
        }
    }

    @Override
    public void onMediaUploadCancelClicked(String mediaId, boolean delete) {

    }

    @Override
    public void onFeaturedImageChanged(long mediaId) {

    }

    @Override
    public void onVideoPressInfoRequested(String videoId) {

    }

    @Override
    public String onAuthHeaderRequested(String url) {
        return "";
    }

    @Override
    public void saveMediaFile(MediaFile mediaFile) {

    }

    @Override
    public void onTrackableEvent(EditorFragmentAbstract.TrackableEvent event) {

    }

    @Override
    public void onEditorFragmentInitialized() {
        // arbitrary setup
        mEditorFragment.setFeaturedImageSupported(true);
        mEditorFragment.setBlogSettingMaxImageWidth("600");
        mEditorFragment.setDebugModeEnabled(true);

        // get title and content and draft switch
        String title = getIntent().getStringExtra(TITLE_PARAM);
        if (title == null)
            title = "";
        String content = getIntent().getStringExtra(CONTENT_PARAM);
        if (content == null)
            content = "";
        boolean isLocalDraft = false; //getIntent().getBooleanExtra(DRAFT_PARAM, true);
        mEditorFragment.setTitle(title);
        mEditorFragment.setContent(content);
        String titlePlaceHolder = getIntent().getStringExtra(TITLE_PLACEHOLDER_PARAM);
        String contentPlaceHolder = getIntent().getStringExtra(CONTENT_PLACEHOLDER_PARAM);
        if (titlePlaceHolder == null)
            titlePlaceHolder = "";
        if (contentPlaceHolder == null)
            contentPlaceHolder = "";
        mEditorFragment.setTitlePlaceholder(titlePlaceHolder);
        mEditorFragment.setContentPlaceholder(contentPlaceHolder);
        mEditorFragment.setLocalDraft(isLocalDraft);
    }

    private void simulateFileUpload(final String mediaId, final String mediaUrl) {
        Thread thread = new Thread() {
            @Override
            public void run() {
                try {
                    float count = (float) 0.1;
                    while (count < 1.1) {
                        sleep(500);

                        ((EditorMediaUploadListener) mEditorFragment).onMediaUploadProgress(mediaId, count);

                        count += 0.1;
                    }

                    MediaFile mediaFile = new MediaFile();
                    mediaFile.setMediaId(MEDIA_REMOTE_ID_SAMPLE);
                    mediaFile.setFileURL(mediaUrl);

                    ((EditorMediaUploadListener) mEditorFragment).onMediaUploadSucceeded(mediaId, mediaFile);

                    if (mFailedUploads.containsKey(mediaId)) {
                        mFailedUploads.remove(mediaId);
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };

        thread.start();
    }

    private void simulateFileUploadFail(final String mediaId, final String mediaUrl) {
        Thread thread = new Thread() {
            @Override
            public void run() {
                try {
                    float count = (float) 0.1;
                    while (count < 0.6) {
                        sleep(500);

                        ((EditorMediaUploadListener) mEditorFragment).onMediaUploadProgress(mediaId, count);

                        count += 0.1;
                    }

                    ((EditorMediaUploadListener) mEditorFragment).onMediaUploadFailed(mediaId,
                            getString(R.string.tap_to_try_again));

                    mFailedUploads.put(mediaId, mediaUrl);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };

        thread.start();
    }

    private void simulateSlowFileUpload(final String mediaId, final String mediaUrl) {
        Thread thread = new Thread() {
            @Override
            public void run() {
                try {
                    sleep(5000);
                    float count = (float) 0.1;
                    while (count < 1.1) {
                        sleep(2000);

                        ((EditorMediaUploadListener) mEditorFragment).onMediaUploadProgress(mediaId, count);

                        count += 0.1;
                    }

                    MediaFile mediaFile = new MediaFile();
                    mediaFile.setMediaId(MEDIA_REMOTE_ID_SAMPLE);
                    mediaFile.setFileURL(mediaUrl);

                    ((EditorMediaUploadListener) mEditorFragment).onMediaUploadSucceeded(mediaId, mediaFile);

                    if (mFailedUploads.containsKey(mediaId)) {
                        mFailedUploads.remove(mediaId);
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };

        thread.start();
    }
}
