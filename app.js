// app.js
const { createApp, ref, computed, onMounted, watch } = Vue
// translations는 전역 변수로 사용 (translations.js에서 정의됨)

const app = createApp({
  setup() {
    // 브라우저 언어 감지 함수
    const detectUserLanguage = () => {
      // 저장된 언어가 있으면 그것을 우선 사용
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang) return savedLang;

      // 브라우저 언어 설정 확인
      const browserLang = navigator.language || navigator.userLanguage;
      const lang = browserLang.toLowerCase();

      // 지원하는 언어와 매칭
      if (lang.startsWith('ko')) return 'ko';
      if (lang.startsWith('ja')) return 'ja';
      if (lang.startsWith('zh-tw')) return 'zh-TW';
      if (lang.startsWith('zh')) return 'zh-CN';
      return 'en'; // 기본값은 영어
    };

    const currentLang = ref(detectUserLanguage())
    const savedData = ref({})
    const searchTerm = ref('')
    const colors = ['red', 'yellow', 'blue', 'purple', 'white', 'pink', 'gray']
    
    const pikminTypes = computed(() => 
      Object.keys(translations[currentLang.value].locations)
    )

    const filteredTypes = computed(() => {
      const searchLower = searchTerm.value.toLowerCase()
      return pikminTypes.value.filter(type => 
        translations[currentLang.value].locations[type].toLowerCase().includes(searchLower)
      )
    })

    const totals = computed(() => {
      return colors.reduce((acc, color) => {
        acc[color] = Object.keys(savedData.value)
          .filter(key => key.startsWith(color) && savedData.value[key])
          .length
        return acc
      }, {})
    })

    const totalTypes = computed(() => filteredTypes.value.length)

    const t = (key, category = 'common') => {
      const categories = ['common', 'categories', 'colors', 'locations'];
      for (let cat of categories) {
        if (translations[currentLang.value][cat]?.[key]) {
          return translations[currentLang.value][cat][key].split(' - ').join('\n');
        }
      }
      return key;
    }

    const changeLanguage = (lang) => {
      currentLang.value = lang
      document.documentElement.lang = lang
      // 선택한 언어를 로컬스토리지에 저장
      localStorage.setItem('preferredLanguage', lang)
      
      // GA 이벤트 트래킹
      gtag('event', 'change_language', {
        'event_category': 'Settings',
        'event_label': lang
      });
    }

    const updateCheckbox = (type, color) => {
      const key = `${color}-${type}`
      savedData.value[key] = !savedData.value[key]
      saveToLocalStorage()
      
      // GA 이벤트 트래킹
      gtag('event', 'update_checkbox', {
        'event_category': 'Interaction',
        'event_label': `${color}-${type}`,
        'value': savedData.value[key] ? 1 : 0
      });
    }

    const getCheckedCount = (type) => {
      const availableColors = getAvailableColors(type);
      return availableColors.filter(color => 
        savedData.value[`${color}-${type}`]
      ).length;
    }

    const isRowCompleted = (type) => {
      const availableColors = getAvailableColors(type);
      return getCheckedCount(type) === availableColors.length;
    }

    const resetAll = () => {
      if (confirm(t('resetConfirm'))) {
        savedData.value = {}
        saveToLocalStorage()
        
        // GA 이벤트 트래킹
        gtag('event', 'reset_all', {
          'event_category': 'Interaction',
          'event_label': 'Reset All Checkboxes'
        });
      }
    }

    const saveToLocalStorage = () => {
      localStorage.setItem('pikminBloomData', JSON.stringify(savedData.value))
    }

    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem('pikminBloomData')
      if (saved) {
        savedData.value = JSON.parse(saved)
      }
    }

    const isChecked = (color, type) => {
      return savedData.value[`${color}-${type}`]
    }

    // 체크박스에 data-type 속성 추가
    const getCheckboxAttrs = (color, type) => ({
      'data-type': `${color}-${type}`,
      checked: savedData.value[`${color}-${type}`]
    })

    // 희귀 타입 체크
    const isRareType = (type) => type.toLowerCase().includes('rare')

    const getPikminImage = (type) => {
      const baseUrl = 'https://pikmin-map.pixelpirate.fr/assets/icons/picture-book/'
      
      // 희귀 타입의 경우 기본 타입의 이미지를 사용
      const normalizedType = type.replace('rare', '').toLowerCase()
      
      const imageMap = {
        'restaurant': 'Restaurant.png',
        'cafe': 'Cafe.png',
        'dessert1': 'Desert.png',
        'dessert2': 'Desert.png',
        'cinema': 'Theatre.png',
        'movietheater': 'Theatre.png',
        'pharmacy': 'Pharmacy.png',
        'zoo': 'Zoo.png',
        'forest1': 'Forest.png',
        'forest2': 'Forest.png',
        'waterside': 'Water.png',
        'postoffice': 'Posts.png',
        'artgallery': 'Museum.png',
        'airport': 'AirPort.png',
        'station1': 'Station.png',
        'station2': 'Station.png',
        'beach': 'Beach.png',
        'burgershop': 'Hamburger.png',
        'conveniencestore1': 'ConvenienceStore.png',
        'conveniencestore2': 'ConvenienceStore.png',
        'supermarket1': 'Supermarket.png',
        'supermarket2': 'Supermarket.png',
        'bakery': 'Bakery.png',
        'beautysalon': 'Salon.png',
        'clothingstore': 'ClosthingStore.png',
        'park': 'Park.png',
        'park1': 'Park.png',
        'park2': 'Park.png',
        'library': 'Library.png',
        'sushirestaurant': 'SushiRestaurant.png',
        'hill': 'Mountain.png',
        'gym': 'Stadium.png',
        'themepark': 'AmusementPark.png',
        'themepark1': 'AmusementPark.png',
        'themepark2': 'AmusementPark.png',
        'busstop': 'BusStop.png',
        'italianrestaurant': 'ItalianRestaurant.png',
        'ramenshop': 'RamenRestaurant.png',
        'bridge': 'Bridge.png',
        'hotel': 'Hotel.png',
        'cosmetics': 'Cosme.png',
        'shrine': 'Omikuji.png',
        'electronics1': 'Electronics.png',
        'electronics2': 'Electronics.png',
        'electronics3': 'Electronics.png',
        'electronics4': 'Electronics.png',
        'electronics5': 'Electronics.png',
        'electronics6': 'Electronics.png',
        'fairyLights1': 'Electronics.png',
        'fairyLights2': 'Electronics.png',
        'curryrestaurant': 'Curry.png',
        'hardwarestore': 'HardwareStore.png',
        'university': 'University.png',
        'mexicanrestaurant': 'MexicanRestaurant.png'
      }
      
      // 타입을 소문자로 변환하여 매칭
      const lookupType = normalizedType.toLowerCase()
      return imageMap[lookupType] ? `${baseUrl}${imageMap[lookupType]}` : ''
    }

    // 색상 제한이 있는 타입들과 그들의 사용 불가능한 색상 매핑
    const colorRestrictions = {
      'rainy1': ['red', 'yellow', 'purple', 'white', 'pink', 'gray'],
      'rainy2': ['red', 'yellow', 'purple', 'white', 'pink', 'gray'],
      'rainy3': ['red', 'yellow', 'purple', 'white', 'pink', 'gray'],
      'snowy': ['red', 'yellow', 'purple', 'pink', 'gray'],
      'electronics1': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'electronics2': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'electronics3': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'electronics4': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'electronics5': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'electronics6': ['red','blue', 'purple', 'white', 'pink', 'gray'],
      'fairyLights1': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'fairyLights2': ['red', 'blue','purple', 'white', 'pink', 'gray'],
      'marioHat': ['red', 'yellow', 'purple','white', 'pink', 'gray'],
      'rareRestaurant': ['purple', 'white', 'pink', 'gray'],
      'gym': ['purple', 'white', 'pink', 'gray'],
      'themePark1': ['purple', 'white', 'pink', 'gray'],
      'themePark2': ['purple', 'white', 'pink', 'gray'],
      'university': ['purple', 'white', 'pink', 'gray']
    }

    // 특정 타입 사용 가능한 색상 확인
    const getAvailableColors = (type) => {
      if (!colorRestrictions[type]) return colors; // 제한이 없으면 모든 색상 사용 가능
      return colors.filter(color => !colorRestrictions[type].includes(color));
    }

    const isColorAvailable = (type, color) => {
      if (!colorRestrictions[type]) return true;
      return !colorRestrictions[type].includes(color);
    }

    watch(currentLang, (newLang) => {
      document.documentElement.lang = newLang
    })

    onMounted(() => {
      loadFromLocalStorage()
      // 페이지 로드 시 저장된 언어 설정 적용
      document.documentElement.lang = currentLang.value
    })

    return {
      currentLang,
      translations,
      savedData,
      searchTerm,
      colors,
      filteredTypes,
      totals,
      totalTypes,
      t,
      changeLanguage,
      updateCheckbox,
      getCheckedCount,
      isRowCompleted,
      resetAll,
      isChecked,
      getCheckboxAttrs,
      isRareType,
      getPikminImage,
      isColorAvailable,
      getAvailableColors
    }
  },

  template: `
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <header class="bg-gradient-to-r from-green-600 to-green-700 shadow-lg relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-16 h-16 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute top-1/2 right-1/4 w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        <div class="container mx-auto px-4 py-4 sm:py-6 relative">
          <div class="relative flex flex-col items-center">
            <select v-model="currentLang" 
                    @change="changeLanguage(currentLang)"
                    class="absolute right-0 top-0 w-32 bg-transparent border-2 border-white/50 
                           text-white rounded-xl px-3 py-1 backdrop-blur-sm hover:border-white 
                           transition-all text-center text-sm">
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
            </select>
            <h1 class="text-2xl sm:text-4xl font-bold text-white text-center drop-shadow-lg mt-12 sm:mt-0">
              {{ t('title') }}
            </h1>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <div class="relative flex-1">
            <input type="text" 
                   v-model="searchTerm" 
                   :placeholder="t('searchPlaceholder')"
                   class="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 pl-12">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </span>
          </div>
          <button @click="resetAll" 
                  class="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95">
            {{ t('resetButton') }}
          </button>
        </div>

        <div class="overflow-y-auto overflow-x-auto h-full">
        <table class="w-full">
            <thead>
            <tr>
                <th class="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-2 sm:px-4 w-[80px] sm:w-[90px]">
                {{ t('type') }}
                </th>
                <th v-for="color in colors" :key="color" 
                    :class="'bg-gradient-to-r from-' + color + '-500 to-' + color + '-600 text-white py-4 px-2 sm:px-4 w-[48px] sm:w-[60px]'">
                {{ t(color) }}
                </th>
            </tr>
            </thead>

            <tbody class="overflow-y-auto" style="max-height: calc(100vh - 300px);">
            <tr v-for="type in filteredTypes" 
                :key="type"
                class="hover:bg-green-50 transition-colors duration-150"
                :class="{ 
                    'bg-green-100': isRowCompleted(type),
                    'hover:bg-green-200': isRowCompleted(type)
                }"
                :data-rare="isRareType(type)">
                <td class="px-2 sm:px-4 py-3 border-b">
                  <div class="location-cell">
                    <div class="location-info">
                      <div class="flex flex-col items-center gap-2">
                        <img v-if="getPikminImage(type)"
                             :src="getPikminImage(type)"
                             :alt="t(type)"
                             class="location-image"
                        >
                        <div class="text-sm sm:text-base break-words font-semibold text-center">
                          {{ t(type) }}
                        </div>
                      </div>
                      <!-- 프로그래스바 영역 주석 처리
                      <div class="progress-container">
                        <template v-if="getCheckedCount(type) === getAvailableColors(type).length">
                          <div class="text-green-600 font-bold text-sm whitespace-nowrap">
                            {{ t('completed') }}
                          </div>
                        </template>
                        <template v-else>
                          <div class="w-full h-1.5 bg-gray-200 rounded-full">
                            <div class="h-full bg-green-500 rounded-full transition-all duration-300"
                                 :style="{ width: (getCheckedCount(type) / getAvailableColors(type).length * 100) + '%' }">
                            </div>
                          </div>
                        </template>
                      </div>
                      -->
                    </div>
                  </div>
                </td>
                <td v-for="color in colors" :key="color" 
                    class="px-1 sm:px-2 py-3 border-b text-center w-[48px] sm:w-[60px]">
                  <input v-if="isColorAvailable(type, color)"
                         type="checkbox" 
                         v-bind="getCheckboxAttrs(color, type)"
                         @change="updateCheckbox(type, color)"
                         :class="[
                             'w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-transform duration-200 hover:scale-110 cursor-pointer',
                             color === 'white' ? 'border-2 border-gray-300' : '',
                             color === 'gray' ? 'bg-gray-600 border-gray-700 ring-1 ring-white/50' : ''
                         ]">
                </td>
            </tr>
            </tbody>

            <tfoot class="sticky bottom-0 z-10 bg-gray-50">
            <tr class="font-bold">
                <td class="px-2 sm:px-4 py-3">
                {{ t('total') }}
                <div class="text-xs sm:text-sm text-gray-500">{{ totalTypes }} {{ t('types') }}</div>
                </td>
                <td v-for="color in colors" :key="color" 
                    class="px-2 sm:px-4 py-3 text-center text-base sm:text-lg">
                {{ totals[color] }}
                </td>
            </tr>
            </tfoot>
        </table>
        </div>
      </main>
    </div>
  `
})

app.mount('#app')