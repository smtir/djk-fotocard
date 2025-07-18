import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./App.css";
import templateImg from './assets/template.png';

const defaultCaption = "এখানে লেখা দিন";
const TEMPLATE_SIZE = 1000;
const BOX_X = 16; // px
const BOX_Y = 32; // px
const BOX_WIDTH = 960; // px
const BOX_HEIGHT = 650; // px
const BOX_RADIUS = 24; // px
const TEXT_AREA_X = BOX_X + 10;
const TEXT_AREA_Y = BOX_Y + BOX_HEIGHT - 70;
const TEXT_AREA_WIDTH = 880;

// Helper to wrap text for canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
  return lines.length;
}

// Helper to get today's dateText in yyyy-mm-dd in GMT+6
function getToday() {
  const now = new Date();
  // Convert to UTC milliseconds, add 6 hours for GMT+6, then get date string
  const gmt6 = new Date(now.getTime() + (6 * 60 - now.getTimezoneOffset()) * 60000);
  return gmt6.toISOString().slice(0, 10);
}

// Helper to convert English digits to Bangla
function toBanglaNumber(str) {
  const en = '0123456789';
  const bn = '০১২৩৪৫৬৭৮৯';
  return str.replace(/[0-9]/g, d => bn[en.indexOf(d)]);
}
// Helper to format yyyy-mm-dd to '১৫ জুলাই ২০২৫'
function formatBanglaDate(dateStr) {
  if (!dateStr) return '';
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const [year, month, day] = dateStr.split('-');
  return `${toBanglaNumber(String(Number(day)))} ${months[Number(month) - 1]} ${toBanglaNumber(year)}`;
}

  // Helper to get dynamic font size for captionText
  function getCaptionFontSize(text) {
    return text.length <= 120 ? '2.8rem' : '2.1rem';
  }
  function getCaptionCanvasFontSize(text) {
    return text.length <= 120 ? 52 : 38;
  }

function App() {
  const [captionText, setCaption] = useState(defaultCaption);
  const [dateText, setDate] = useState(getToday());
  const [creditText, setCredit] = useState('');
  const [newsImageValue, setImage] = useState(null);
  const newsImageFileInput = useRef();
  const [adsImageValue, setAdImage] = useState(null);
  const adsImageFileInput = useRef();
  const [showDetails, setShowDetails] = useState(false);
  const [newsImageError, setNewsImageError] = useState("");
  const [adsImageError, setAdsImageError] = useState("");

  const handleNewsImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setNewsImageError("শুধুমাত্র JPG, PNG, GIF, BMP, WebP ফরম্যাট সাপোর্ট করবে");
      return;
    }
    setNewsImageError("");
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleNewsImageDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      newsImageFileInput.current.files = e.dataTransfer.files;
      handleNewsImageChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleAdImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setAdsImageError("শুধুমাত্র JPG, PNG, GIF, BMP, WebP ফরম্যাট সাপোর্ট করবে");
      return;
    }
    setAdsImageError("");
    const reader = new FileReader();
    reader.onload = (ev) => setAdImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleadsImageDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      adsImageFileInput.current.files = e.dataTransfer.files;
      handleAdImageChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleDownload = async () => {
    if (!newsImageValue) return;
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let win;
    if (isIOS) {
      win = window.open(); // Open synchronously on click
    }
    // Create a canvas and draw the uploaded newsImageValue, then overlay the template
    const canvas = document.createElement('canvas');
    canvas.width = TEMPLATE_SIZE;
    canvas.height = TEMPLATE_SIZE;
    const ctx = canvas.getContext('2d');

    // Draw the uploaded newsImageValue inside the box, maintaining aspect ratio (object-fit: contain)
    const userImg = new window.Image();
    userImg.src = newsImageValue;
    await new Promise(resolve => { userImg.onload = resolve; });
    // Calculate object-fit: contain placement
    const boxAR = BOX_WIDTH / BOX_HEIGHT;
    const imgAR = userImg.width / userImg.height;
    let drawW = BOX_WIDTH, drawH = BOX_HEIGHT, drawX = BOX_X, drawY = BOX_Y;
    if (imgAR > boxAR) {
      // newsImageValue is wider
      drawW = BOX_WIDTH;
      drawH = BOX_WIDTH / imgAR;
      drawY = BOX_Y + (BOX_HEIGHT - drawH) / 2;
    } else {
      // newsImageValue is taller
      drawH = BOX_HEIGHT;
      drawW = BOX_HEIGHT * imgAR;
      drawX = BOX_X + (BOX_WIDTH - drawW) / 2;
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(BOX_X + BOX_RADIUS, BOX_Y);
    ctx.lineTo(BOX_X + BOX_WIDTH - BOX_RADIUS, BOX_Y);
    ctx.quadraticCurveTo(BOX_X + BOX_WIDTH, BOX_Y, BOX_X + BOX_WIDTH, BOX_Y + BOX_RADIUS);
    ctx.lineTo(BOX_X + BOX_WIDTH, BOX_Y + BOX_HEIGHT - BOX_RADIUS);
    ctx.quadraticCurveTo(BOX_X + BOX_WIDTH, BOX_Y + BOX_HEIGHT, BOX_X + BOX_WIDTH - BOX_RADIUS, BOX_Y + BOX_HEIGHT);
    ctx.lineTo(BOX_X + BOX_RADIUS, BOX_Y + BOX_HEIGHT);
    ctx.quadraticCurveTo(BOX_X, BOX_Y + BOX_HEIGHT, BOX_X, BOX_Y + BOX_HEIGHT - BOX_RADIUS);
    ctx.lineTo(BOX_X, BOX_Y + BOX_RADIUS);
    ctx.quadraticCurveTo(BOX_X, BOX_Y, BOX_X + BOX_RADIUS, BOX_Y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Overlay the template PNG (with transparent box)
    const bg = new window.Image();
    bg.src = templateImg;
    await new Promise(resolve => { bg.onload = resolve; });
    ctx.drawImage(bg, 0, 0, TEMPLATE_SIZE, TEMPLATE_SIZE);

    // Draw the text below the box, centered and wrapped
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let textY = TEXT_AREA_Y;
    // captionText (canvas)
    ctx.font = `bold ${getCaptionCanvasFontSize(captionText)}px Tiro Bangla, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.save();
    const paragraphs = captionText.split('\n');
    let y = (!showDetails && !adsImageValue)
    ? (BOX_Y + BOX_HEIGHT + (TEMPLATE_SIZE - (BOX_Y + BOX_HEIGHT) - 200) / 2 - 40)
    : TEXT_AREA_Y;
    let isFirstVisualLine = true;
    for (let i = 0; i < paragraphs.length; i++) {
      // Wrap paragraph into lines
      const words = paragraphs[i].split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + (line ? ' ' : '') + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > TEXT_AREA_WIDTH && n > 0) {
          // Draw the current line
          if (isFirstVisualLine) {
            ctx.fillStyle = '#222';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.fillText(line, TEMPLATE_SIZE / 2, y);
            isFirstVisualLine = false;
          } else {
            ctx.fillStyle = 'red';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeText(line, TEMPLATE_SIZE / 2, y);
            ctx.fillText(line, TEMPLATE_SIZE / 2, y);
          }
          y += getCaptionCanvasFontSize(captionText) + 6;
          line = words[n];
        } else {
          line = testLine;
        }
      }
      // Draw the last line of the paragraph
      if (isFirstVisualLine) {
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.fillText(line, TEMPLATE_SIZE / 2, y);
        isFirstVisualLine = false;
      } else {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeText(line, TEMPLATE_SIZE / 2, y);
        ctx.fillText(line, TEMPLATE_SIZE / 2, y);
      }
      y += getCaptionCanvasFontSize(captionText) + 6;
    }
    ctx.restore();
    // Show details text if checked
    if (showDetails && adsImageValue) {
      ctx.save();
      ctx.font = 'bold 24px Tiro Bangla, serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('বিস্তারিত কমেন্টে...', TEMPLATE_SIZE / 2, TEMPLATE_SIZE - 165);
      ctx.restore();
    } else if(showDetails && !adsImageValue) {
      ctx.save();
      ctx.font = 'bold 24px Tiro Bangla, serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('বিস্তারিত কমেন্টে...', TEMPLATE_SIZE / 2, TEMPLATE_SIZE - 45);
      ctx.restore();
    }
    // dateText and creditText at the top (matching preview)
    ctx.save();
    if (!creditText) {
      ctx.font = 'bold 24px Tiro Bangla, serif';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('তারিখ: ' + formatBanglaDate(dateText), 32, 35);
    } else {
      ctx.font = 'bold 16px Tiro Bangla, serif';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('তারিখ: ' + formatBanglaDate(dateText), 32, 20);

      ctx.font = 'bold 28px Tiro Bangla, serif';
      ctx.fillStyle = '#000';
      ctx.fillText(creditText, 32, 38);
    }
    ctx.restore();

    // Draw ad image at the very bottom if present
    if (adsImageValue) {
      const adImg = new window.Image();
      adImg.src = adsImageValue;
      await new Promise(resolve => { adImg.onload = resolve; });
      // Draw ad image at the very bottom, full width, max height 100px, object-fit: contain
      let adW = TEMPLATE_SIZE, adH = 125, adX = (TEMPLATE_SIZE - adW) / 2, adY = TEMPLATE_SIZE - (adImg.height + 39);
      ctx.drawImage(adImg, adX, adY, adW, adH);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL();
    if (isIOS) {
      win.location = dataUrl;
      alert('iPhone/iPad-এ ডাউনলোড করতে, নতুন ট্যাবে খুলে ছবির উপর ট্যাপ করে ধরে রাখুন এবং "Save Image" বেছে নিন।');
      return;
    }
    // Normal download for other browsers
    const link = document.createElement('a');
    link.download = 'fotocard.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
  };

  const handleClear = () => {
    setImage(null);
    setNewsImageError("");
    setAdsImageError("");
    newsImageFileInput.current.value = null;
    adsImageFileInput.current.value = null;
  };

  return (
    <div className="container">
      <h1 className="title">দেশ ও জনতার কন্ঠ <span className="redlish">ফটোকার্ড সিস্টেম</span></h1>
      <div className="upload-section">
        <label htmlFor="file-upload" className="upload-label" onDrop={handleNewsImageDrop} onDragOver={e => e.preventDefault()}>
          {newsImageValue ? (
            <img src={newsImageValue} alt="Uploaded" className="preview-img" />
          ) : (
            <div className="upload-placeholder">
              <span role="img" aria-label="camera" className="camera-icon">📷</span>
              <div>নিউজের ছবি আপলোড করুন</div>
              <div className="formats">JPG, PNG, GIF, BMP, WebP ফরম্যাটের ছবিগুলা সাপোর্ট করবে</div>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
            onChange={handleNewsImageChange}
            ref={newsImageFileInput}
            style={{ display: "none" }}
          />
        </label>
        <div className="button-row">
          <button className="blue-btn" onClick={() => newsImageFileInput.current.click()}>ছবি বেছে নিন</button>
          {newsImageValue && <button className="clear-btn" onClick={handleClear}>ছবি ক্লিয়ার করুন</button>}
        </div>
        {newsImageError && <div className="error">{newsImageError}</div>}
        {/* Ad image upload UI */}
        <div style={{ marginTop: 16 }}>
          <label htmlFor="ad-upload" className="upload-label" onDrop={handleadsImageDrop} onDragOver={e => e.preventDefault()}>
            {adsImageValue ? (
              <img src={adsImageValue} alt="Ad" style={{ maxWidth: 300, maxHeight: 60, display: 'block', margin: '0 auto' }} />
            ) : (
              <div className="upload-placeholder">
                <span role="img" aria-label="camera" className="camera-icon">📷</span>
                <div>এড ব্যানার আপলোড করুন</div>
                <div className="formats">JPG, PNG, GIF, BMP, WebP ফরম্যাটের ছবিগুলা সাপোর্ট করবে</div>
              </div>
            )}
            <input
              id="ad-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
              onChange={handleAdImageChange}
              ref={adsImageFileInput}
              style={{ display: "none" }}
            />
          </label>
          <button className="blue-btn" style={{ marginTop: 4 }} onClick={() => adsImageFileInput.current.click()}>এড ব্যানার বেছে নিন</button>
          {adsImageValue && <button className="clear-btn" style={{ marginLeft: 8 }} onClick={() => setAdImage(null)}>এড ক্লিয়ার করুন</button>}
          {adsImageError && <div className="error">{adsImageError}</div>}
        </div>
      </div>
      <div className="editor-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          className="caption-input"
          value={captionText}
          onChange={e => setCaption(e.target.value)}
          placeholder="ক্যাপশন"
          rows={3}
          style={{ width: '100%', fontSize: 22, padding: 8, border: '1px solid #ffd600', borderRadius: 6, resize: 'vertical', fontFamily: "'Tiro Bangla', serif" }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="date-input"
            type="date"
            value={dateText}
            onChange={e => setDate(e.target.value)}
            placeholder="তারিখ"
            style={{ flex: 1, minWidth: 120, fontSize: 18, padding: 8, border: '1px solid #ffd600', borderRadius: 6, fontFamily: "'Tiro Bangla', serif" }}
          />
          <input
            className="credit-input"
            type="text"
            value={creditText}
            onChange={e => setCredit(e.target.value)}
            placeholder="সোর্স দিন, যেমন: সুত্র: প্রথমআলো"
            style={{ flex: 1, minWidth: 120, fontSize: 18, padding: 8, border: '1px solid #ffd600', borderRadius: 6, fontFamily: "'Tiro Bangla', serif" }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <input
            type="checkbox"
            id="show-details"
            checked={showDetails}
            onChange={e => setShowDetails(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <label htmlFor="show-details" style={{ fontSize: 18, cursor: 'pointer' }}>বিস্তারিত কমেন্ট দেখাতে চান?</label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        
        <button className="download-btn" onClick={handleDownload} disabled={!newsImageValue}>ডাউনলোড করুন</button>
        </div>
      </div>
      <div className="card-preview-wrapper" style={{ position: 'relative', width: TEMPLATE_SIZE, height: TEMPLATE_SIZE }}>
        {/* Uploaded newsImageValue inside the white box, clipped */}
        {newsImageValue && (
          <img
            src={newsImageValue}
            alt="card"
            style={{
              position: 'absolute',
              left: BOX_X,
              top: BOX_Y,
              width: BOX_WIDTH,
              height: BOX_HEIGHT,
              objectFit: 'contain',
              borderRadius: `${BOX_RADIUS}px`,
              background: 'none',
              zIndex: 1,
              clipPath: `path('M${BOX_X + BOX_RADIUS},${BOX_Y} L${BOX_X + BOX_WIDTH - BOX_RADIUS},${BOX_Y} Q${BOX_X + BOX_WIDTH},${BOX_Y} ${BOX_X + BOX_WIDTH},${BOX_Y + BOX_RADIUS} L${BOX_X + BOX_WIDTH},${BOX_Y + BOX_HEIGHT - BOX_RADIUS} Q${BOX_X + BOX_WIDTH},${BOX_Y + BOX_HEIGHT} ${BOX_X + BOX_WIDTH - BOX_RADIUS},${BOX_Y + BOX_HEIGHT} L${BOX_X + BOX_RADIUS},${BOX_Y + BOX_HEIGHT} Q${BOX_X},${BOX_Y + BOX_HEIGHT} ${BOX_X},${BOX_Y + BOX_HEIGHT - BOX_RADIUS} L${BOX_X},${BOX_Y + BOX_RADIUS} Q${BOX_X},${BOX_Y} ${BOX_X + BOX_RADIUS},${BOX_Y} Z')`,
            }}
          />
        )}
        {/* Overlay the template PNG (with transparent box) */}
        <img
          src={templateImg}
          alt="template"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: TEMPLATE_SIZE,
            height: TEMPLATE_SIZE,
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        {/* dateText and creditText at the top */}
        {creditText ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: 32,
                top: 10,
                fontFamily: "'Tiro Bangla', serif",
                fontSize: 16,
                color: '#222',
                fontWeight: 700,
                zIndex: 4,
                pointerEvents: 'none',
                background: 'none',
              }}
            >তারিখ: {formatBanglaDate(dateText)}
            </div>
            <div style={{   
                position: 'absolute',
                left: 32,
                top: 28,
                fontFamily: "'Tiro Bangla', serif",
                fontSize: 28,
                color: '#000',
                fontWeight: 700,
                zIndex: 4,
                pointerEvents: 'none',
                background: 'none' }}>
              {creditText}
            </div>
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: 32,
              top: 35,
              fontFamily: "'Tiro Bangla', serif",
              fontSize: 24,
              color: '#222',
              fontWeight: 700,
              zIndex: 4,
              pointerEvents: 'none',
              background: 'none',
            }}
          >তারিখ: {formatBanglaDate(dateText)}
          </div>
        )}
        {/* Output text preview (captionText) */}
        <div
          style={{
            position: 'absolute',
            top: (!showDetails && !adsImageValue)
              ? (BOX_Y + BOX_HEIGHT + (TEMPLATE_SIZE - (BOX_Y + BOX_HEIGHT) - 200) / 2 - 40)
              : TEXT_AREA_Y,
            left: TEXT_AREA_X,
            width: TEXT_AREA_WIDTH,
            textAlign: 'center',
            padding: '0 20px',
            fontFamily: "'Tiro Bangla', serif",
            color: '#222',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {(() => {
            // Visual line splitting for preview
            const lines = [];
            const paragraphs = captionText.split('\n');
            let isFirstVisualLine = true;
            paragraphs.forEach(paragraph => {
              const words = paragraph.split(' ');
              let line = '';
              words.forEach((word, idx) => {
                const testLine = line + (line ? ' ' : '') + word;
                // Create a dummy canvas for measuring
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `bold ${getCaptionCanvasFontSize(captionText)}px Tiro Bangla, serif`;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > TEXT_AREA_WIDTH && idx > 0) {
                  lines.push({ text: line, isFirst: isFirstVisualLine });
                  isFirstVisualLine = false;
                  line = word;
                } else {
                  line = testLine;
                }
              });
              lines.push({ text: line, isFirst: isFirstVisualLine });
              isFirstVisualLine = false;
            });
            return lines.map((line, idx) =>
              line.isFirst ? (
                <div key={idx} style={{ fontSize: getCaptionFontSize(captionText), fontWeight: 700, marginBottom: 2, lineHeight: 1.2, wordBreak: 'break-word', color: '#222', textShadow: `
                  -1px -1px 0 white,
                  1px -1px 0 white,
                  -1px 1px 0 white,
                  1px 1px 0 white,
                  0px -1px 0 white,
                  0px 1px 0 white,
                  -1px 0px 0 white,
                  1px 0px 0 white
                ` }}>{line.text}</div>
              ) : (
                <div key={idx} style={{ fontSize: getCaptionFontSize(captionText), fontWeight: 700, marginBottom: 2, lineHeight: 1.2, wordBreak: 'break-word', color: 'red', 
                  textShadow: `
                    -1px -1px 0 white,
                    1px -1px 0 white,
                    -1px 1px 0 white,
                    1px 1px 0 white,
                    0px -1px 0 white,
                    0px 1px 0 white,
                    -1px 0px 0 white,
                    1px 0px 0 white
                  `
                }}>{line.text}</div>
              )
            );
          })()}
        </div>
        
        {/* Ads and details logic */}
        {adsImageValue && showDetails && (
          <>
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 165,
              width: '100%',
              textAlign: 'center',
              fontFamily: "'Tiro Bangla', serif",
              fontSize: 24,
              color: '#000',
              fontWeight: 700,
              zIndex: 11,
              pointerEvents: 'none',
              background: 'none'
            }}>
              বিস্তারিত কমেন্টে...
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 65,
                width: TEMPLATE_SIZE,
                height: 100,
                objectFit: 'contain',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
              <img src={adsImageValue} alt="ads" />
            </div>
          </>
        )}
        {!adsImageValue && showDetails && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 40,
            width: '100%',
            textAlign: 'center',
            fontFamily: "'Tiro Bangla', serif",
            fontSize: 24,
            color: '#000',
            fontWeight: 700,
            zIndex: 11,
            pointerEvents: 'none',
            background: 'none'
          }}>
            বিস্তারিত কমেন্টে...
          </div>
        )}
        {adsImageValue && !showDetails && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 65,
              width: TEMPLATE_SIZE,
              height: 100,
              objectFit: 'contain',
              zIndex: 10,
              pointerEvents: 'none',
            }}>
            <img src={adsImageValue} alt="ads" />
          </div>
        )}
      </div>
     
      <div className="footer">তৈরী করেছে: <a target="_blank" href="https://www.facebook.com/smtirX">তাওহিদুল ইসলাম রাজীব</a></div>
    </div>
  );
}

export default App; 