document.addEventListener('DOMContentLoaded', (event) => {
    console.log('1. DOMContentLoaded 이벤트 발생 - 스크립트 실행 시작'); // <--- 1번 로그

    // HTML 요소들을 JavaScript 변수에 연결합니다.
    const imageUpload = document.getElementById('imageUpload');
    const imageToCrop = document.getElementById('imageToCrop');
    const imageEditorSection = document.querySelector('.image-editor-section');
    const toolSection = document.querySelector('.tool-section');
    const snsButtons = document.querySelectorAll('.sns-options button');
    const imageCanvas = document.getElementById('imageCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const previewArea = document.querySelector('.preview-area');

    // 이 부분에서 imageCanvas가 null이면 이 다음 줄에서 에러 발생
    let ctx = null;
    if (imageCanvas) {
        ctx = imageCanvas.getContext('2d');
        console.log('2. imageCanvas와 ctx 가져오기 성공.'); // <--- 2번 로그
    } else {
        console.error('오류: imageCanvas 요소를 찾을 수 없습니다!'); // <--- 이 에러가 뜨면 HTML 문제
    }

    console.log('3. 모든 HTML 요소 연결 시도 완료. imageUpload:', imageUpload, 'imageToCrop:', imageToCrop); // <--- 3번 로그


    let cropper = null;
    let currentSNSType = null;

    const SNS_CONFIG = {
        instagram: { ratio: 1 / 1, size: 1080, type: 'square' },
        youtube: { ratio: 1 / 1, size: 800, type: 'circle' },
        kakao: { ratio: 1 / 1, size: 800, type: 'square' },
        facebook: { ratio: 1 / 1, size: 720, type: 'square' },
        x: { ratio: 1 / 1, size: 400, type: 'circle' }
    };

    // 1. 이미지 업로드 처리: 사용자가 파일을 선택하면 실행됩니다.
    if (imageUpload) { // imageUpload 요소가 있을 때만 이벤트 리스너 등록
        imageUpload.addEventListener('change', (e) => {
            console.log('4. imageUpload change 이벤트 발생!'); // <--- 4번 로그 (이벤트가 감지되면 뜸)
            const file = e.target.files[0];
            if (file) {
                console.log('5. 파일이 선택되었습니다:', file.name, '파일 크기:', file.size); // <--- 5번 로그
                const reader = new FileReader();
                reader.onload = (event) => {
                    console.log('6. FileReader: 이미지 로드 완료 (src 설정 직전)'); // <--- 6번 로그
                    imageToCrop.src = event.target.result;

                    // 기존 Cropper.js 인스턴스가 있다면 파괴하여 초기화합니다.
                    if (cropper) {
                        cropper.destroy();
                        console.log('7. 기존 Cropper 인스턴스 파괴.'); // <--- 7번 로그
                    }

                    // Cropper.js 라이브러리를 초기화하고 img 태그에 적용합니다.
                    if (imageToCrop.src) { // 이미지가 로드되었는지 확인 후 Cropper 초기화
                        cropper = new Cropper(imageToCrop, {
                            aspectRatio: 1 / 1,
                            viewMode: 1,
                            minCropBoxWidth: 100,
                            minCropBoxHeight: 100,
                            ready: function () {
                                console.log('8. Cropper.js 준비 완료.'); // <--- 8번 로그
                                imageEditorSection.style.display = 'flex';
                                toolSection.style.display = 'block';
                                updatePreview();
                            },
                            crop: function() {
                                updatePreview();
                            }
                        });
                    } else {
                        console.error('오류: imageToCrop.src가 비어있어 Cropper를 초기화할 수 없습니다.');
                    }


                    snsButtons.forEach(btn => btn.classList.remove('selected'));
                    currentSNSType = null;
                };
                reader.readAsDataURL(file);
            } else {
                console.log('5. 파일 선택이 취소되었거나 유효한 파일이 아닙니다.'); // <--- 5번의 else
            }
        });
    } else {
        console.error('오류: imageUpload 요소를 찾을 수 없습니다. HTML ID 확인 필요!'); // <--- 이 에러가 뜨면 HTML 문제
    }

    // Cropper.js 컨트롤 버튼 (회전, 확대/축소, 초기화) 이벤트 리스너 설정
    document.getElementById('rotateLeftBtn')?.addEventListener('click', () => { // ?는 요소가 없어도 에러 안나게 함
        if (cropper) cropper.rotate(-90);
    });
    document.getElementById('rotateRightBtn')?.addEventListener('click', () => {
        if (cropper) cropper.rotate(90);
    });
    document.getElementById('zoomInBtn')?.addEventListener('click', () => {
        if (cropper) cropper.zoom(0.1);
    });
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
        if (cropper) cropper.zoom(-0.1);
    });
    document.getElementById('resetBtn')?.addEventListener('click', () => {
        if (cropper) cropper.reset();
    });


    // 2. SNS 플랫폼 선택 처리: 사용자가 SNS 버튼을 클릭하면 실행됩니다.
    snsButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!cropper) {
                alert('먼저 사진을 업로드 해주세요.');
                return;
            }

            snsButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            currentSNSType = button.dataset.sns;
            const config = SNS_CONFIG[currentSNSType];

            cropper.setAspectRatio(config.ratio);

            updatePreview();

            if (config.type === 'circle') {
                previewArea.classList.add('circle');
            } else {
                previewArea.classList.remove('circle');
            }
        });
    });

    // 미리보기 캔버스 업데이트 함수: 현재 크롭된 이미지를 캔버스에 그려 미리 보여줍니다.
    function updatePreview() {
        if (!cropper || !ctx) return; // Cropper.js 인스턴스 또는 캔버스 컨텍스트가 없으면 함수 종료

        const config = SNS_CONFIG[currentSNSType || 'instagram'];
        const targetSize = config.size;

        const croppedCanvas = cropper.getCroppedCanvas({
            width: targetSize,
            height: targetSize,
            imageSmoothingQuality: 'high'
        });

        imageCanvas.width = targetSize;
        imageCanvas.height = targetSize;
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(croppedCanvas, 0, 0, targetSize, targetSize);

        if (config.type === 'circle') {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    }


    // 3. 다운로드 기능: '다운로드' 버튼 클릭 시 실행됩니다.
    downloadBtn.addEventListener('click', () => {
        if (!cropper || !currentSNSType) {
            alert('사진을 업로드하고 SNS를 선택해주세요.');
            return;
        }

        const config = SNS_CONFIG[currentSNSType];
        const targetSize = config.size;
        const fileName = `profile_${currentSNSType}_${Date.now()}.png`;

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

        if (config.type === 'circle') {
            finalCtx.globalCompositeOperation = 'destination-in';
            finalCtx.beginPath();
            finalCtx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
            finalCtx.closePath();
            finalCtx.fill();
            finalCtx.globalCompositeOperation = 'source-over';
        }

        finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png', 0.9);
    });
});