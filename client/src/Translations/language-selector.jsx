import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTextSize } from '../TextSizeContext';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

const languages = [
    {code: "en-US", lang: "English"},
    {code: "es", lang: "Español"},
    {code: "fr", lang: "Français"},
    {code: "ar", lang: "عربي"},
];

const LanguageSelector = () => {
    const {i18n} = useTranslation();
    const { scaleFactor } = useTextSize();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="langtrans-container">
            <DropdownButton
                id="dropdown-basic-button"
                title={languages.find(lng => lng.code === i18n.language)?.lang}
                style={{ fontSize: `${16 * scaleFactor}px` }}
            >
                {languages.map((lng) => (
                    <Dropdown.Item 
                        key={lng.code} 
                        onClick={() => changeLanguage(lng.code)}
                        active={lng.code === i18n.language}
                    >
                        {lng.lang}
                    </Dropdown.Item>
                ))}
            </DropdownButton>
        </div>
    );
};

export default LanguageSelector;
