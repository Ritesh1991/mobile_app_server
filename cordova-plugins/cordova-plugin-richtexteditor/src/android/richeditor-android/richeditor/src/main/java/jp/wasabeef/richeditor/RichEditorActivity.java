package jp.wasabeef.richeditor;

import android.graphics.Color;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.TextView;
import jp.wasabeef.richeditor.RichEditor;
import android.content.Intent;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.ImageButton;
import android.graphics.drawable.Drawable;
import android.content.res.ColorStateList;
import android.support.v4.graphics.drawable.DrawableCompat;
import java.util.List;

import org.hotshare.everywhere.R;


public class RichEditorActivity extends AppCompatActivity {

  private RichEditor mEditor;
  private TextView mPreview;
  public static final String CONTENT_PARAM = "CONTENT_PARAM";

  public static Drawable tintDrawable(Drawable drawable, ColorStateList colors) {
    final Drawable wrappedDrawable = DrawableCompat.wrap(drawable);
    DrawableCompat.setTintList(wrappedDrawable, colors);
    return wrappedDrawable;
  }
  //ColorStateList tint = a.getTintManager().getTintList(a.getResourceId(0, -1));
  //AppCompatDrawableManager.getTintList();


  public void changeImageButtonColor(int id, boolean isChanged) {
    ImageButton ivButton = (ImageButton) findViewById(id);
    Drawable src = ivButton.getDrawable();
    String color = isChanged ? "#585858" : "#3498DB";
    ivButton.setImageDrawable(tintDrawable(src,ColorStateList.valueOf(Color.parseColor(color))));
    //ivButton.setImageDrawable(tintDrawable(src,ColorStateList.valueOf(Color.WHITE)));
    //ivButton.setImageDrawable(tintDrawable(src, getResources().getColorStateList(R.color.selector_imagebutton_richeditor)));
  }

  @Override protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.richeditor_activity_main);
    mEditor = (RichEditor) findViewById(R.id.editor);
    //mEditor.setEditorHeight(200);
    mEditor.setEditorFontSize(18);
    mEditor.setEditorFontColor(Color.BLACK);
    //mEditor.setEditorBackgroundColor(Color.BLUE);
    //mEditor.setBackgroundColor(Color.BLUE);
    //mEditor.setBackgroundResource(R.drawable.bg);
    //mEditor.setPadding(10, 10, 10, 10);
    //mEditor.setBackground("https://raw.githubusercontent.com/wasabeef/art/master/chip.jpg");
    //mEditor.setPlaceholder("Insert text here...");
    //mEditor.setInputEnabled(false);

    String content = getIntent().getStringExtra(CONTENT_PARAM);
    if (content == null)
        content = "Insert text here...";
    mEditor.setHtml(content);

    //mPreview = (TextView) findViewById(R.id.preview);
    mEditor.setOnTextChangeListener(new RichEditor.OnTextChangeListener() {
      @Override public void onTextChange(String text) {
        //mPreview.setText(text);
      }
    });

    mEditor.setOnDecorationChangeListener(new RichEditor.OnDecorationStateListener() {
      private boolean checkIfExist(List<RichEditor.Type> types, RichEditor.Type checkedType) {
        for (RichEditor.Type type : types) {
            if (checkedType == type) {
                return true;
            }
        }
        return false;
      }
      @Override public void onStateChangeListener(String text, List<RichEditor.Type> types) {
        if (checkIfExist(types, RichEditor.Type.BOLD)) {
            changeImageButtonColor(R.id.action_bold, false);
        } else {
            changeImageButtonColor(R.id.action_bold, true);
        }

        if (checkIfExist(types, RichEditor.Type.ITALIC)) {
            changeImageButtonColor(R.id.action_italic, false);
        } else {
            changeImageButtonColor(R.id.action_italic, true);
        }

        if (checkIfExist(types, RichEditor.Type.SUBSCRIPT)) {
            changeImageButtonColor(R.id.action_subscript, false);
        } else {
            changeImageButtonColor(R.id.action_subscript, true);
        }

        if (checkIfExist(types, RichEditor.Type.SUPERSCRIPT)) {
            changeImageButtonColor(R.id.action_superscript, false);
        } else {
            changeImageButtonColor(R.id.action_superscript, true);
        }
        if (checkIfExist(types, RichEditor.Type.STRIKETHROUGH)) {
            changeImageButtonColor(R.id.action_strikethrough, false);
        } else {
            changeImageButtonColor(R.id.action_strikethrough, true);
        }

        if (checkIfExist(types, RichEditor.Type.UNDERLINE)) {
            changeImageButtonColor(R.id.action_underline, false);
        } else {
            changeImageButtonColor(R.id.action_underline, true);
        }

        if (checkIfExist(types, RichEditor.Type.H1)) {
            changeImageButtonColor(R.id.action_heading1, false);
        } else {
            changeImageButtonColor(R.id.action_heading1, true);
        }

        if (checkIfExist(types, RichEditor.Type.H2)) {
            changeImageButtonColor(R.id.action_heading2, false);
        } else {
            changeImageButtonColor(R.id.action_heading2, true);
        }

        if (checkIfExist(types, RichEditor.Type.H3)) {
            changeImageButtonColor(R.id.action_heading3, false);
        } else {
            changeImageButtonColor(R.id.action_heading3, true);
        }

        if (checkIfExist(types, RichEditor.Type.H4)) {
            changeImageButtonColor(R.id.action_heading4, false);
        } else {
            changeImageButtonColor(R.id.action_heading4, true);
        }
        if (checkIfExist(types, RichEditor.Type.H5)) {
            changeImageButtonColor(R.id.action_heading5, false);
        } else {
            changeImageButtonColor(R.id.action_heading5, true);
        }

        if (checkIfExist(types, RichEditor.Type.H6)) {
            changeImageButtonColor(R.id.action_heading6, false);
        } else {
            changeImageButtonColor(R.id.action_heading6, true);
        }

        if (checkIfExist(types, RichEditor.Type.FORECOLOR)) {
            changeImageButtonColor(R.id.action_txt_color, false);
        } else {
            changeImageButtonColor(R.id.action_txt_color, true);
        }
        if (checkIfExist(types, RichEditor.Type.BACKCOLOR)) {
            changeImageButtonColor(R.id.action_bg_color, false);
        } else {
            changeImageButtonColor(R.id.action_bg_color, true);
        }
        if (checkIfExist(types, RichEditor.Type.BLOCKQUOTE)) {
            changeImageButtonColor(R.id.action_blockquote, false);
        } else {
            changeImageButtonColor(R.id.action_blockquote, true);
        }

        if (checkIfExist(types, RichEditor.Type.INSERTORDEREDLIST)) {
            changeImageButtonColor(R.id.action_insert_numbers, false);
        } else {
            changeImageButtonColor(R.id.action_insert_numbers, true);
        }
        if (checkIfExist(types, RichEditor.Type.UNORDEREDLIST)) {
            changeImageButtonColor(R.id.action_insert_bullets, false);
        } else {
            changeImageButtonColor(R.id.action_insert_bullets, true);
        }

        if (checkIfExist(types, RichEditor.Type.JUSTIFYCENTER)) {
            changeImageButtonColor(R.id.action_align_center, false);
        } else {
            changeImageButtonColor(R.id.action_align_center, true);
        }
        if (checkIfExist(types, RichEditor.Type.JUSTIFYFULL)) {
            //changeImageButtonColor(R.id.action_bold, false);
        } else {
            //changeImageButtonColor(R.id.action_bold, true);
        }
        if (checkIfExist(types, RichEditor.Type.JUSTIFYLEFT)) {
            changeImageButtonColor(R.id.action_align_left, false);
        } else {
            changeImageButtonColor(R.id.action_align_left, true);
        }
        if (checkIfExist(types, RichEditor.Type.JUSTIFYRIGHT)) {
            changeImageButtonColor(R.id.action_align_right, false);
        } else {
            changeImageButtonColor(R.id.action_align_right, true);
        }
      }
    });

    findViewById(R.id.action_undo).setOnClickListener(new View.OnClickListener() {
      @Override public void onClick(View v) {
        mEditor.undo();
      }
    });

    findViewById(R.id.action_redo).setOnClickListener(new View.OnClickListener() {
      @Override public void onClick(View v) {
        mEditor.redo();
      }
    });

    findViewById(R.id.action_bold).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setBold();
        changeImageButtonColor(R.id.action_bold, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_italic).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setItalic();
        changeImageButtonColor(R.id.action_italic, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_subscript).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setSubscript();
        changeImageButtonColor(R.id.action_subscript, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_superscript).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setSuperscript();
        changeImageButtonColor(R.id.action_superscript, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_strikethrough).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setStrikeThrough();
        changeImageButtonColor(R.id.action_strikethrough, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_underline).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setUnderline();
        changeImageButtonColor(R.id.action_underline, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_heading1).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setHeading(1);
        }
        changeImageButtonColor(R.id.action_heading1, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_heading2).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setHeading(2);
        }
        changeImageButtonColor(R.id.action_heading2, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_heading3).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setHeading(3);
        }
        changeImageButtonColor(R.id.action_heading3, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_heading4).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setHeading(4);
        }
        changeImageButtonColor(R.id.action_heading4, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_heading5).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setHeading(5);
        }
        changeImageButtonColor(R.id.action_heading5, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_heading6).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setHeading(6);
        }
        changeImageButtonColor(R.id.action_heading6, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_txt_color).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;

      @Override public void onClick(View v) {
        mEditor.setTextColor(isChanged ? Color.BLACK : Color.RED);
        changeImageButtonColor(R.id.action_txt_color, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_bg_color).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;

      @Override public void onClick(View v) {
        mEditor.setTextBackgroundColor(isChanged ? Color.WHITE : Color.YELLOW);
        changeImageButtonColor(R.id.action_bg_color, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_indent).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setIndent();
        changeImageButtonColor(R.id.action_indent, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_outdent).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setOutdent();
        changeImageButtonColor(R.id.action_outdent, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_align_left).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setAlignLeft();
        changeImageButtonColor(R.id.action_align_left, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_align_center).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setAlignCenter();
        changeImageButtonColor(R.id.action_align_center, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_align_right).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setAlignRight();
        changeImageButtonColor(R.id.action_align_right, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_blockquote).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        if (isChanged) {
            mEditor.setParagraph();
        } else {
            mEditor.setBlockquote();
        }
        changeImageButtonColor(R.id.action_blockquote, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_insert_bullets).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setBullets();
        changeImageButtonColor(R.id.action_insert_bullets, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_insert_numbers).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        mEditor.setNumbers();
        changeImageButtonColor(R.id.action_insert_numbers, isChanged);
        isChanged = !isChanged;
      }
    });

    findViewById(R.id.action_insert_image).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        //changeImageButtonColor(R.id.action_insert_image, isChanged);
        //isChanged = !isChanged;
        mEditor.insertImage("http://www.1honeywan.com/dachshund/image/7.21/7.21_3_thumb.JPG",
            "dachshund");
      }
    });

    findViewById(R.id.action_insert_link).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        //changeImageButtonColor(R.id.action_insert_link, isChanged);
        //isChanged = !isChanged;
        mEditor.insertLink("https://github.com/wasabeef", "wasabeef");
      }
    });
    findViewById(R.id.action_insert_checkbox).setOnClickListener(new View.OnClickListener() {
      private boolean isChanged;
      @Override public void onClick(View v) {
        //changeImageButtonColor(R.id.action_insert_checkbox, isChanged);
        //isChanged = !isChanged;
        mEditor.insertTodo();
      }
    });
  }

  @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_titlebar_done, menu);
        return true;
    }

  @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_titlebar_done) {
            try {
                new Thread( new Runnable() {
                    public void run()  {
                        try  {
                            Intent data = new Intent();
                            Bundle res = new Bundle();
                            //res.putCharSequence("html", mEditor.getHtml());
                            res.putCharSequence("html", mEditor.getContent());
                            data.putExtras(res);
                            setResult(RESULT_OK, data);
                            finish();
                        }
                        catch (Exception ie)  {}
                    }
                } ).start();
                /*Intent data = new Intent();
                Bundle res = new Bundle();
                //res.putCharSequence("html", mEditor.getHtml());
                res.putCharSequence("html", mEditor.getContent());
                data.putExtras(res);
                setResult(RESULT_OK, data);
                finish();*/
            } catch (Exception e) {
              // This will catch any exception, because they are all descended from Exception
              //System.out.println("Error " + e.getMessage());
              e.printStackTrace();
            }
          return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
