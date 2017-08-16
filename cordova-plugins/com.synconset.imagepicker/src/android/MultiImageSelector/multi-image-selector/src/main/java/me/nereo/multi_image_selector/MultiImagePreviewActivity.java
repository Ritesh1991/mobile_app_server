package me.nereo.multi_image_selector;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;

import java.io.File;
import java.util.ArrayList;

public class MultiImagePreviewActivity extends AppCompatActivity {

    private String imgPath = null;

    private boolean markChecked = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTheme(R.style.MIS_NO_ACTIONBAR);
        setContentView(R.layout.mis_activity_multi_image_preview);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.BLACK);
        }

        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        if(toolbar != null){
            setSupportActionBar(toolbar);
        }

        final ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayHomeAsUpEnabled(true);
        }

        final Intent intent = getIntent();
        if(intent.hasExtra("preview_image")) {
            imgPath = intent.getStringExtra("preview_image");
            markChecked = intent.getBooleanExtra("selected", false);
        }

        final ImageView iv = (ImageView)findViewById(R.id.img_preview);
        iv.setImageURI(Uri.fromFile(new File(imgPath)));
        iv.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent data = new Intent();
                Bundle res = new Bundle();
                res.putBoolean("SELECTED", markChecked);
                res.putString("SELECTEDFILE", imgPath);
                data.putExtras(res);
                setResult(RESULT_OK, data);

                finish();
            }
        });

        ImageView ivMark = (ImageView)findViewById(R.id.bigcheckmark);
        if (markChecked)
            ivMark.setImageResource(R.drawable.mis_btn_selected);
        ivMark.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                markChecked = !markChecked;
                if (markChecked)
                    ((ImageView)view).setImageResource(R.drawable.mis_btn_selected);
                else
                    ((ImageView)view).setImageResource(R.drawable.mis_btn_unselected);
            }
        });

        /*Button btnPrev = (Button)findViewById(R.id.btn_prev);
        Button btnNext = (Button)findViewById(R.id.btn_next);
        btnPrev.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                int lastIdx = curImgIdx;
                curImgIdx--;
                if (curImgIdx < 0)
                    curImgIdx = imgList.size() - 1;
                if (curImgIdx != lastIdx) {
                    iv.setImageURI(Uri.fromFile(new File(imgList.get(curImgIdx))));
                }
            }
        });
        btnNext.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                int lastIdx = curImgIdx;
                curImgIdx++;
                if (curImgIdx > imgList.size() - 1)
                    curImgIdx = 0;
                if (curImgIdx != lastIdx) {
                    iv.setImageURI(Uri.fromFile(new File(imgList.get(curImgIdx))));
                }
            }
        });*/
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:

                Intent data = new Intent();
                Bundle res = new Bundle();
                res.putBoolean("SELECTED", markChecked);
                res.putString("SELECTEDFILE", imgPath);
                data.putExtras(res);
                setResult(RESULT_OK, data);

                finish();
                return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
