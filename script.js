document.addEventListener('DOMContentLoaded', (event) => {
    // HTML 요소들을 JavaScript 변수에 연결합니다.
    const imageUpload = document.getElementById('imageUpload'); // 파일 업로드 input
    const imageToCrop = document.getElementById('imageToCrop'); // Cropper.js가 적용될 이미지 태그
    const imageEditorSection = document.querySelector('.image-editor-section'); // 이미지 편집 섹션 전체
    const toolSection = document.querySelector('.tool-section'); // SNS 선택 및 다운로드 섹션
    const snsButtons = document.querySelectorAll('.sns-options button'); // SNS 선택 버튼들
    const imageCanvas = document.getElementById('imageCanvas'); // 미리보기 및 최종 이미지를 그릴 캔버스
    const downloadBtn = document.getElementById('downloadBtn'); // 다운로드 버튼
    const previewArea = document.querySelector('.preview-area'); // 미리보기 영역 (원형/사각형 스타일 변경용)
    const ctx = imageCanvas.getContext('2d'); // 캔버스에 그림을 그리는 데 필요한 2D 렌더링 컨텍스트

    // Cropper.js 인스턴스와 현재 선택된 SNS 타입을 저장할 변수
    let cropper = null;
    let currentSNSType = null;

    // 각 SNS 플랫폼의 프로필 사진 최적화 설정 (비율, 최종 크기, 형태)
    const SNS_CONFIG = {
        instagram: { ratio: 1 / 1, size: 1080, type: 'square' },
        youtube: { ratio: 1 / 1, size: 800, type: 'circle' },
        kakao: { ratio: 1 / 1, size: 800, type: 'square' },
        facebook: { ratio: 1 / 1, size: 720, type: 'square' },
        x: { ratio: 1 / 1, size: 400, type: 'circle' }
    };

    // 1. 이미지 업로드 처리: 사용자가 파일을 선택하면 실행됩니다.
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0]; // 선택된 파일 가져오기
        if (file) {
            const reader = new FileReader(); // 파일을 읽기 위한 FileReader 객체 생성
            reader.onload = (event) => {
                imageToCrop.src = event.target.result; // 읽어온 이미지 데이터를 img 태그의 src로 설정

                // 기존 Cropper.js 인스턴스가 있다면 파괴하여 초기화합니다.
                if (cropper) {
                    cropper.destroy();
                }

                // Cropper.js 라이브러리를 초기화하고 img 태그에 적용합니다.
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1 / 1, // 기본 크롭 비율을 1:1 (정방형)로 설정
                    viewMode: 1, // 크롭 박스가 이미지 컨테이너 밖으로 나가지 않도록 설정
                    minCropBoxWidth: 100, // 크롭 박스의 최소 너비
                    minCropBoxHeight: 100, // 크롭 박스의 최소 높이
                    ready: function () {
                        // Cropper.js가 준비되면 이미지 편집 및 도구 섹션을 보이도록 합니다.
                        imageEditorSection.style.display = 'flex';
                        toolSection.style.display = 'block';

                        // 초기 미리보기를 업데이트합니다. (기본 1:1 비율)
                        updatePreview();
                    },
                    crop: function() {
                        // 크롭 박스(사용자가 조절하는 선택 영역)가 변경될 때마다 미리보기를 업데이트합니다.
                        updatePreview();
                    }
                });

                // 모든 SNS 버튼의 'selected' 클래스를 제거하여 선택 상태를 초기화합니다.
                snsButtons.forEach(btn => btn.classList.remove('selected'));
                currentSNSType = null; // 현재 선택된 SNS 타입도 초기화
            };
            reader.readAsDataURL(file); // 파일을 Data URL 형식으로 읽어옵니다.
        }
    });

    // Cropper.js 컨트롤 버튼 (회전, 확대/축소, 초기화) 이벤트 리스너 설정
    document.getElementById('rotateLeftBtn').addEventListener('click', () => {
        if (cropper) cropper.rotate(-90); // 시계 반대 방향으로 90도 회전
    });
    document.getElementById('rotateRightBtn').addEventListener('click', () => {
        if (cropper) cropper.rotate(90); // 시계 방향으로 90도 회전
    });
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        if (cropper) cropper.zoom(0.1); // 0.1만큼 확대
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        if (cropper) cropper.zoom(-0.1); // -0.1만큼 축소
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (cropper) cropper.reset(); // 크롭퍼 상태를 초기화 (원본 이미지, 비율, 위치 등)
    });


    // 2. SNS 플랫폼 선택 처리: 사용자가 SNS 버튼을 클릭하면 실행됩니다.
    snsButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!cropper) {
                alert('먼저 사진을 업로드 해주세요.'); // 이미지가 없으면 경고 메시지 표시
                return;
            }

            // 모든 SNS 버튼의 'selected' 클래스를 제거하여 선택 상태를 초기화합니다.
            snsButtons.forEach(btn => btn.classList.remove('selected'));
            // 현재 클릭된 버튼에 'selected' 클래스를 추가하여 선택 상태를 표시합니다.
            button.classList.add('selected');

            currentSNSType = button.dataset.sns; // 클릭된 버튼의 data-sns 속성 값(예: 'instagram') 가져오기
            const config = SNS_CONFIG[currentSNSType]; // 해당 SNS의 설정을 가져오기

            // Cropper.js의 크롭 비율을 선택된 SNS의 비율로 설정합니다.
            cropper.setAspectRatio(config.ratio);

            // 미리보기를 업데이트합니다.
            updatePreview();

            // 미리보기 영역의 스타일을 원형 또는 사각형으로 변경합니다.
            if (config.type === 'circle') {
                previewArea.classList.add('circle'); // 'circle' 클래스 추가 (CSS에서 border-radius: 50% 적용)
            } else {
                previewArea.classList.remove('circle'); // 'circle' 클래스 제거
            }
        });
    });

    // 미리보기 캔버스 업데이트 함수: 현재 크롭된 이미지를 캔버스에 그려 미리 보여줍니다.
    function updatePreview() {
        if (!cropper) return; // Cropper.js 인스턴스가 없으면 함수 종료

        // 현재 선택된 SNS 설정 또는 기본 Instagram 설정을 가져옵니다.
        const config = SNS_CONFIG[currentSNSType || 'instagram']; // 선택 없으면 인스타그램 기본
        const targetSize = config.size; // 최종 이미지 크기 (예: 1080px)

        // Cropper.js에서 현재 크롭된 영역의 이미지를 캔버스 형태로 가져옵니다.
        const croppedCanvas = cropper.getCroppedCanvas({
            width: targetSize, // 최종 이미지 너비
            height: targetSize, // 최종 이미지 높이
            imageSmoothingQuality: 'high' // 이미지 스무딩 품질 설정
        });

        imageCanvas.width = targetSize; // 미리보기 캔버스 크기를 설정
        imageCanvas.height = targetSize;
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height); // 캔버스 내용 지우기

        // 크롭된 이미지를 미리보기 캔버스에 그립니다.
        ctx.drawImage(croppedCanvas, 0, 0, targetSize, targetSize);

        // 원형으로 표시될 경우 마스킹 처리: 유튜브나 X(트위터)처럼 프로필이 원형인 경우
        if (config.type === 'circle') {
            ctx.globalCompositeOperation = 'destination-in'; // 캔버스 그리기 모드를 '겹치는 부분만 남기기'로 설정
            ctx.beginPath(); // 새로운 경로 시작
            ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2); // 원형 경로 그리기
            ctx.closePath(); // 경로 닫기
            ctx.fill(); // 경로 내부를 채워서 원형 마스킹 적용
            ctx.globalCompositeOperation = 'source-over'; // 그리기 모드를 원래대로 되돌리기
        }
    }


    // 3. 다운로드 기능: '다운로드' 버튼 클릭 시 실행됩니다.
    downloadBtn.addEventListener('click', () => {
        if (!cropper || !currentSNSType) {
            alert('사진을 업로드하고 SNS를 선택해주세요.'); // 이미지가 없거나 SNS가 선택되지 않았으면 경고
            return;
        }

        const config = SNS_CONFIG[currentSNSType]; // 현재 선택된 SNS 설정 가져오기
        const targetSize = config.size; // 최종 이미지 크기
        const fileName = `profile_${currentSNSType}_${Date.now()}.png`; // 다운로드될 파일 이름 생성

        // 최종 다운로드할 이미지를 그릴 임시 캔버스 생성
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetSize;
        finalCanvas.height = targetSize;
        const finalCtx = finalCanvas.getContext('2d');

        // Cropper.js에서 최종 크롭된 이미지를 가져옵니다.
        const croppedCanvas = cropper.getCroppedCanvas({
            width: targetSize,
            height: targetSize,
            imageSmoothingQuality: 'high'
        });

        // 크롭된 이미지를 최종 캔버스에 그립니다.
        finalCtx.drawImage(croppedCanvas, 0, 0, targetSize, targetSize);

        // 원형으로 표시될 경우 마스킹 처리 (최종 다운로드 이미지에 적용)
        if (config.type === 'circle') {
            finalCtx.globalCompositeOperation = 'destination-in';
            finalCtx.beginPath();
            finalCtx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
            finalCtx.closePath();
            finalCtx.fill();
            finalCtx.globalCompositeOperation = 'source-over';
        }

        // 최종 캔버스 내용을 PNG 이미지로 변환하여 다운로드 링크를 생성합니다.
        finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob); // Blob 객체를 URL로 변환
            const a = document.createElement('a'); // 가상의 <a> 태그 생성
            a.href = url; // 다운로드할 파일의 URL 설정
            a.download = fileName; // 파일 이름 설정
            document.body.appendChild(a); // <a> 태그를 문서에 임시로 추가
            a.click(); // <a> 태그를 클릭하여 다운로드 시작
            document.body.removeChild(a); // 다운로드 후 <a> 태그 제거
            URL.revokeObjectURL(url); // 생성된 URL 메모리 해제 (메모리 누수 방지)
        }, 'image/png', 0.9); // PNG 형식, 품질 0.9 (압축)로 Blob 생성
    });
}); // document.addEventListener('DOMContentLoaded', ...) 의 닫는 부분입니다. 이 괄호가 모든 코드를 감싸야 합니다!