import { useTranslation } from 'react-i18next';
import { useTextSize } from '../TextSizeContext';

const languages = [
    {code: "en", lang: "English"},
    {code: "es", lang: "Español"},
    {code: "fr", lang: "Français"},
    {code: "ar", lang: "عربي"},
];

const LanguageSelector = () => {
    const {i18n} = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    /*useEffect(() => {
        document.body.dir = i18n.dir()
    }, [i18n, i18n.language]) //This code switches from LTR to RTL
*/
    const { scaleFactor } = useTextSize();
    return (
        <div className="btn-container">
            {languages.map((lng) => {
                return (
                    <button style={{ fontSize: `${16 * scaleFactor}px` }} className={lng.code === i18n.language ? "selected" : ""} key={lng.code} onClick={()=>changeLanguage(lng.code)}>{lng.lang}</button>
                );
            })}
    </div>
)}

export default LanguageSelector;
