document.addEventListener('DOMContentLoaded', (event) => {
    // 여기에 기존 script.js 파일의 모든 내용을 붙여넣으세요.
    // 즉, 아래 const imageUpload = document.getElementById('imageUpload'); 부터
    // 맨 마지막 } 까지 모두 이 코드 블록 안에 들어가야 합니다.

    const imageUpload = document.getElementById('imageUpload');
    const imageToCrop = document.getElementById('imageToCrop'); // Cropper.js가 적용될 img 태그
    const imageEditorSection = document.querySelector('.image-editor-section');
    const toolSection = document.querySelector('.tool-section');
    const snsButtons = document.querySelectorAll('.sns-options button');
    const imageCanvas = document.getElementById('imageCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const previewArea = document.querySelector('.preview-area');
    const ctx = imageCanvas.getContext('2d'); // 이 줄에서 에러가 났었죠! 이제 해결됩니다.

    let cropper = null; // Cropper.js 인스턴스
    let currentSNSType = null; // 현재 선택된 SNS 타입

    // SNS별 최적화 비율 및 크기 정의 (가로:세로 비율)
    const SNS_CONFIG = {
        instagram: { ratio: 1 / 1, size: 1080, type: 'square' },
        youtube: { ratio: 1 / 1, size: 800, type: 'circle' },
        kakao: { ratio: 1 / 1, size: 800, type: 'square' },
        facebook: { ratio: 1 / 1, size: 720, type: 'square' },
        x: { ratio: 1 / 1, size: 400, type: 'circle' }
    };

    // 이미지 업로드 처리
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imageToCrop.src = event.target.result; // img 태그에 이미지 로드

                // 기존 Cropper 인스턴스 있으면 제거
                if (cropper) {
                    cropper.destroy();
                }

                // Cropper.js 초기화
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1 / 1, // 기본 1:1 비율로 시작 (대부분 SNS 프로필 기본)
                    viewMode: 1, // 크롭 박스가 컨테이너 밖으로 나가지 않게 함
                    minCropBoxWidth: 100, // 최소 크롭 박스 크기
                    minCropBoxHeight: 100,
                    ready: function () {
                        // Cropper가 준비되면 편집 섹션 및 툴 섹션 보여주기
                        imageEditorSection.style.display = 'flex';
                        toolSection.style.display = 'block';

                        // 초기 미리보기 업데이트
                        updatePreview();
                    },
                    crop: function() {
                        // 크롭 박스 변경 시 미리보기 업데이트
                        updatePreview();
                    }
                });

                // 모든 SNS 버튼 초기화
                snsButtons.forEach(btn => btn.classList.remove('selected'));
                currentSNSType = null;
            };
            reader.readAsDataURL(file);
        }
    });

    // Cropper.js 컨트롤 버튼 이벤트 리스너
    document.getElementById('rotateLeftBtn').addEventListener('click', () => {
        if (cropper) cropper.rotate(-90);
    });
    document.getElementById('rotateRightBtn').addEventListener('click', () => {
        if (cropper) cropper.rotate(90);
    });
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        if (cropper) cropper.zoom(0.1);
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        if (cropper) cropper.zoom(-0.1);
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (cropper) cropper.reset();
    });


    // SNS 플랫폼 선택 처리
    snsButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!cropper) {
                alert('먼저 사진을 업로드 해주세요.');
                return;
            }

            // 기존 선택된 버튼 해제
            snsButtons.forEach(btn => btn.classList.remove('selected'));
            // 현재 버튼 선택 표시
            button.classList.add('selected');

            currentSNSType = button.dataset.sns;
            const config = SNS_CONFIG[currentSNSType];

            // Cropper.js의 비율 설정
            cropper.setAspectRatio(config.ratio);

            // 미리보기 업데이트
            updatePreview();

            // 미리보기 영역의 원형/사각형 스타일 변경
            if (config.type === 'circle') {
                previewArea.classList.add('circle');
            } else {
                previewArea.classList.remove('circle');
            }
        });
    });

    // 미리보기 캔버스 업데이트 함수
    function updatePreview() {
        if (!cropper) return;

        const config = SNS_CONFIG[currentSNSType || 'instagram']; // 선택 없으면 인스타그램 기본
        const targetSize = config.size;

        const croppedCanvas = cropper.getCroppedCanvas({
            width: targetSize,
            height: targetSize,
            imageSmoothingQuality: 'high'
        });

        imageCanvas.width = targetSize;
        imageCanvas.height = targetSize;
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

        // 이미지 그리기
        ctx.drawImage(croppedCanvas, 0, 0, targetSize, targetSize);

        // 원형으로 표시될 경우 마스킹 처리 (미리보기만)
        if (config.type === 'circle') {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over'; // 원래대로 되돌리기
        }
    }


    // 다운로드 기능
    downloadBtn.addEventListener('click', () => {
        if (!cropper || !currentSNSType) {
            alert('사진을 업로드하고 SNS를 선택해주세요.');
            return;
        }

        const config = SNS_CONFIG[currentSNSType];
        const targetSize = config.size;
        const fileName = `profile_${currentSNSType}_${Date.now()}.png`;

        // 최종 다운로드할 이미지를 캔버스에 그리기
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetSize;
        finalCanvas.height = targetSize;
        const finalCtx = finalCanvas.getContext('2d');

        const croppedCanvas = cropper.getCroppedCanvas({
            width: targetSize,
            height: targetSize,
            imageSmoothingQuality: 'high'
        });

        finalCtx.drawImage(croppedCanvas, 0, 0, targetSize, targetSize);

        // 원형 마스킹 (최종 다운로드 이미지에 적용)
        if (config.type === 'circle') {
            finalCtx.globalCompositeOperation = 'destination-in';
            finalCtx.beginPath();
            finalCtx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
            finalCtx.closePath();
            finalCtx.fill();
            finalCtx.globalCompositeOperation = 'source-over';
        }

        // 캔버스 내용을 PNG 이미지로 변환하여 다운로드
        finalCanvas.toBlob((blob) => {
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
}); // <--- 이 닫는 괄호와 세미콜론이 중요합니다!