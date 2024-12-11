document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  const storageKey = "pikminBloomData";

  // Load saved data from localStorage
  const savedData = JSON.parse(localStorage.getItem(storageKey)) || {};

  // Initialize checkboxes
  checkboxes.forEach((checkbox) => {
    const type = checkbox.dataset.type;
    if (savedData[type]) {
      checkbox.checked = true;
    }

    // Save changes to localStorage
    checkbox.addEventListener("change", () => {
      savedData[type] = checkbox.checked;
      localStorage.setItem(storageKey, JSON.stringify(savedData));
      
      // 체크박스 변경시 합계 업데이트
      updateTotals();
    });
  });

  // 체크박스 카운트 업데이트 함수
  function updateCheckboxCount(row) {
    const checkboxes = row.querySelectorAll('input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(box => box.checked).length;
    const totalCount = checkboxes.length;
    
    const countDisplay = row.querySelector('.checkbox-count .checked-count');
    if (countDisplay) {
      countDisplay.textContent = checkedCount;
    }
  }

  // 체크박스 변경 이벤트 수정
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const row = this.closest('tr');
      const checkboxes = row.querySelectorAll('input[type="checkbox"]');
      const allChecked = Array.from(checkboxes).every(box => box.checked);
      
      if (allChecked) {
        row.classList.add('completed');
      } else {
        row.classList.remove('completed');
      }
      
      // 체크박스 카운트 업데이트
      updateCheckboxCount(row);
    });
  });

  // 초기화 버튼 기능
  const resetButton = document.getElementById('resetButton');
  resetButton.addEventListener('click', () => {
    const confirmed = confirm('정말 모든 체크박스를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    
    if (confirmed) {
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      
      localStorage.setItem(storageKey, JSON.stringify({}));
      
      document.querySelectorAll('tr.completed').forEach(row => {
        row.classList.remove('completed');
      });

      // 초기화 후 합계 업데이트
      updateTotals();
    }
  });

  // 합계 업데이트 함수
  function updateTotals() {
    const totalTypes = document.querySelectorAll('tbody tr:not(.hidden)').length;
    document.querySelector('.total-types').textContent = `${totalTypes} 종류`;

    // 각 색상별 체크된 개수 계산
    ['red', 'yellow', 'blue', 'purple', 'white', 'pink', 'gray'].forEach(color => {
        const checked = document.querySelectorAll(`tbody tr:not(.hidden) input[data-type^="${color}-"]:checked`).length;
        document.querySelector(`.total-cell[data-color="${color}"]`).textContent = checked;
    });
  }

  // 페이지 로드시 초기 상태 설정
  document.querySelectorAll('tr').forEach(row => {
    updateCheckboxCount(row);
    const checkboxes = row.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      const allChecked = Array.from(checkboxes).every(box => box.checked);
      if (allChecked) {
        row.classList.add('completed');
      }
    }
  });

  // 페이지 로드시 초기 합계 계산
  updateTotals();

  const searchInput = document.getElementById('searchInput');

  // 검색 기능
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.querySelector('td:first-child').textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
    
    // 검색어가 비어있으면 모든 행 표시
    if (searchTerm === '') {
        rows.forEach(row => row.classList.remove('hidden'));
    }
    
    // 합계 업데이트 (표시된 행만 계산)
    updateTotals();
  });
});
