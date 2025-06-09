const imageUpload = document.getElementById('imageUpload');
const toolSection = document.querySelector('.tool-section');
const snsButtons = document.querySelectorAll('.sns-options button');
const imageCanvas = document.getElementById('imageCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const previewGuide = document.querySelector('.preview-guide');
const ctx = imageCanvas.getContext('2d');

let uploadedImage = null; // 원본 이미지 객체
let cropper = null; // Cropper.js 인스턴스
let currentSNSType = null;

// SNS별 최적화 비율 및 크기 정의 (가로:세로 비율)
const SNS_CONFIG = {
    instagram: { ratio: 1 / 1, size: 1080, type: 'square' },
    youtube: { ratio: 1 / 1, size: 800, type: 'circle' }, // 유튜브는 실제 원형으로 보여야 함
    kakao: { ratio: 1 / 1, size: 800, type: 'square' },
    facebook: { ratio: 1 / 1, size: 720, type: 'square' },
    x: { ratio: 1 / 1, size: 400, type: 'circle' } // X(트위터)도 실제 원형
};

// 1. 이미지 업로드 처리
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImage = new Image();
            uploadedImage.src = event.target.result;
            uploadedImage.onload = () => {
                // 이미지가 로드되면 툴 섹션 보여주기
                toolSection.style.display = 'block';
                previewGuide.style.display = 'none'; // 미리보기 가이드 숨기기

                // 기존 Cropper 인스턴스 있으면 제거 (새 이미지 업로드 시)
                if (cropper) {
                    cropper.destroy();
                }

                // Cropper.js를 사용하기 위해 이미지를 캔버스에 그리는 대신
                // 임시 img 태그를 생성하거나, 원본 이미지를 직접 처리하는 방식으로 변경해야 합니다.
                // 여기서는 간단하게 캔버스에 그리는 방식으로 진행.
                // Cropper.js는 img 태그에 적용하는 것이 일반적입니다.
                // 복잡한 Cropper.js 연동은 별도의 학습이 필요합니다.
                // 우선은 간단하게 캔버스에 이미지를 그려서 미리보기를 보여주는 방식으로 구현합니다.
                drawOriginalImageToCanvas(uploadedImage);

                // 모든 SNS 버튼 초기화
                snsButtons.forEach(btn => btn.classList.remove('selected'));
                currentSNSType = null; // SNS 선택 초기화
            };
        };
        reader.readAsDataURL(file);
    }
});

// 원본 이미지를 캔버스에 그리는 함수 (초기 미리보기)
function drawOriginalImageToCanvas(img) {
    const maxDim = Math.max(img.width, img.height);
    const scale = Math.min(imageCanvas.width, imageCanvas.height) / maxDim; // 캔버스 크기에 맞게 스케일 조정
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (imageCanvas.width - scaledWidth) / 2;
    const offsetY = (imageCanvas.height - scaledHeight) / 2;

    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
}

// 2. SNS 플랫폼 선택 및 처리
snsButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 기존 선택된 버튼 해제
        snsButtons.forEach(btn => btn.classList.remove('selected'));
        // 현재 버튼 선택 표시
        button.classList.add('selected');

        currentSNSType = button.dataset.sns;
        processImageForSNS(currentSNSType);
    });
});

// 이미지 처리 함수 (핵심 로직)
function processImageForSNS(sns) {
    if (!uploadedImage) {
        alert('먼저 사진을 업로드 해주세요.');
        return;
    }

    const config = SNS_CONFIG[sns];
    if (!config) return;

    const targetSize = config.size; // 최종 이미지 크기 (예: 1080px)

    // 캔버스 크기 재설정 (최종 결과물 크기로)
    imageCanvas.width = targetSize;
    imageCanvas.height = targetSize;

    // 크롭할 영역 계산 (중앙 정방형으로 크롭)
    const aspectRatio = config.ratio;
    let sourceX = 0, sourceY = 0, sourceWidth = uploadedImage.width, sourceHeight = uploadedImage.height;

    if (uploadedImage.width / uploadedImage.height > aspectRatio) { // 원본 가로가 더 길 때
        sourceWidth = uploadedImage.height * aspectRatio;
        sourceX = (uploadedImage.width - sourceWidth) / 2;
    } else { // 원본 세로가 더 길 때
        sourceHeight = uploadedImage.width / aspectRatio;
        sourceY = (uploadedImage.height - sourceHeight) / 2;
    }

    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(uploadedImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetSize, targetSize);

    // 원형 크롭 (유튜브, X 등)
    if (config.type === 'circle') {
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; // 원래대로 되돌리기
    }

    // 미리보기 영역 업데이트 (canvas의 스타일 변경)
    const previewArea = document.querySelector('.preview-area');
    if (config.type === 'circle') {
        previewArea.style.borderRadius = '50%'; // 미리보기 영역을 원형으로
    } else {
        previewArea.style.borderRadius = '10px'; // 다시 사각형으로
    }
    previewArea.style.width = '250px'; // 미리보기 크기는 고정
    previewArea.style.height = '250px';
    // 실제 캔버스 내용은 위에서 targetSize로 그려졌지만, previewArea 스타일로 보여주는 크기 조절
    imageCanvas.style.width = '100%';
    imageCanvas.style.height = '100%';

    // Cropper.js를 사용하여 사용자에게 직접 크롭 영역을 조정할 수 있는 UI를 제공하려면
    // Cropper.js 인스턴스를 img 태그에 적용하고, 그 결과를 캔버스에 그리는 방식으로 구현해야 합니다.
    // 이 예시는 Cropper.js 없이 기본적인 중앙 크롭만 구현했습니다.
}

// 3. 다운로드 기능
downloadBtn.addEventListener('click', () => {
    if (!uploadedImage || !currentSNSType) {
        alert('먼저 사진을 업로드하고 SNS를 선택해주세요.');
        return;
    }

    const config = SNS_CONFIG[currentSNSType];
    const fileName = `profile_${currentSNSType}_${Date.now()}.png`; // 파일명

    // 캔버스 내용을 PNG 이미지로 변환하여 다운로드
    imageCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // 메모리 해제
    }, 'image/png', 0.9); // PNG 형식, 품질 0.9 (압축)
});

// 파일 업로드 영역 클릭 시 실제 input 클릭되도록
const uploadGuide = document.querySelector('.upload-section .guide-text');
if (uploadGuide) { // 가이드 텍스트가 있을 때만 이벤트 리스너 추가
     uploadGuide.addEventListener('click', () => {
        imageUpload.click();
    });
}