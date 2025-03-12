import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import xClose from '../../svg/x_close.svg';
import { formatDate, getNoticationTitle, getNotificationDescription, getPartnerManagerUrl, handleServiceErrors, isLangRTL, onPressEnterKey } from "../../utils/AppUtils";
import featuredIcon from "../../svg/featured_icon.svg";
import noNotificationIcon from "../../svg/frame.svg";
import { getUserProfile } from "../../services/UserProfileService";
import { useNavigate } from "react-router-dom";
import FocusTrap from "focus-trap-react";
import { HttpService } from "../../services/HttpService";
import LoadingIcon from "./LoadingIcon";
import ErrorMessage from "./ErrorMessage";

function NotificationPopup({ closeNotification }) {
    const { t } = useTranslation();
    const navigate = useNavigate('');
    const isLoginLanguageRTL = isLangRTL(getUserProfile().langCode);
    const [errorCode, setErrorCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerHeight < 620);
    const [notifications, setNotifications] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(true);

    const fetchNotifications = async () => {
        const queryParams = new URLSearchParams();
        queryParams.append('pageSize', 4);
        queryParams.append('pageNo', 0);
        queryParams.append('notificationStatus', 'active');
        const url = `${getPartnerManagerUrl('/notifications', process.env.NODE_ENV)}?${queryParams.toString()}`;
        try {
            setDataLoaded(false);
            const response = await HttpService.get(url);
            if (response) {
                const responseData = response.data;
                if (responseData && responseData.response) {
                    const resData = responseData.response.data;
                    setNotifications(resData);
                } else {
                    handleServiceErrors(responseData, setErrorCode, setErrorMsg);
                }
            } else {
                setErrorMsg(t('notificationPopup.errorInNotifcations'));
            }
            setDataLoaded(true);
        } catch (err) {
            console.error('Error fetching data:', err);
            if (err.response?.status && err.response.status !== 401) {
                setErrorMsg(err.toString());
            }
            setDataLoaded(true);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const updateScreenSize = () => {
            setIsSmallScreen(window.innerHeight < 620);
        };

        window.addEventListener('resize', updateScreenSize);
        return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    useEffect(() => {
            document.body.style.overflow = "hidden";
    
            return () => {
                document.body.style.overflow = "auto";
            };
    }, []);

    const dismissNotification = (id) => {
        setNotifications(notifications.filter(notification => notification.notificationId !== id));
    };

    const viewAllNotifications = () => {
        if (getUserProfile().roles.includes('PARTNER_ADMIN')) {
            closeNotification();
            navigate('/partnermanagement/admin/view-root-certificate-notifications');
        }
    };

    const styles = {
        loadingDiv: "!py-[40%]"
    };

    const cancelErrorMsg = () => {
        setErrorMsg("");
    };

    const errorcustomStyle = {
        outerDiv: "!flex !justify-center",
        innerDiv: "!flex !justify-between !items-center !rounded-none !bg-moderate-red !md:w-[25rem] !w-full !min-h-[3.2rem] !h-fit !px-4 !py-[10px]",
        cancelIcon: "!top-[5.25rem]"
    }

    return (
        <div className={`absolute top-[3.75rem] ${isLoginLanguageRTL ? 'max-850:left-4 left-[15rem]' : 'max-850:right-4 right-[15rem]'} bg-white w-[25rem] max-520:w-[286px] rounded-lg shadow-lg border border-gray-200 z-50`}>
            <FocusTrap focusTrapOptions={{ initialFocus: false, allowOutsideClick: true }}>
                <div>
                    {!dataLoaded && (
                        <LoadingIcon styleSet={styles} />
                    )}
                    {dataLoaded && (
                        <div>
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 cursor-default">
                                <h2 className="text-lg font-bold text-gray-800">{t('notificationPopup.notification')}</h2>
                                <img src={xClose} alt='' id='xIcon' onClick={closeNotification} className="cursor-pointer" />
                            </div>
                            {errorMsg && (
                                <ErrorMessage errorCode={errorCode} errorMessage={errorMsg} clickOnCancel={cancelErrorMsg} customStyle={errorcustomStyle}/>
                            )}
                            {notifications.length > 0 ? (
                                <>
                                    <p className={`text-sm text-[#6F6E6E] font-medium ${isLoginLanguageRTL ? 'mr-4' : 'ml-4'} my-2`}>latest</p>
                                    <div className={`${isSmallScreen ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
                                        {notifications.map(notification => (
                                            <div key={notification.notificationId} className="flex justify-between items-start p-2 border-b border-gray-200">
                                                <img src={featuredIcon} alt='' id='featuredIcon' className={`${isLoginLanguageRTL ? 'ml-3' : 'mr-3'} mt-1`} />
                                                <div>
                                                    <div className="flex justify-between space-x-2">
                                                        <p className={`text-sm font-semibold text-gray-900 ${isLoginLanguageRTL ? 'text-right': 'text-left'}`}>{getNoticationTitle(notification, t)}</p>
                                                        <p className={`text-xs text-[#CBCDD0] ${isLoginLanguageRTL ? 'text-left': 'text-right'}`}>{formatDate(notification.createdDateTime, 'dateTime')}</p>
                                                    </div>
                                                    <p className="text-sm text-[#344054] mt-1 whitespace-pre-line">{getNotificationDescription(notification, t)}</p>
                                                    <button 
                                                        className="text-[#475467] text-sm mt-2"
                                                        onClick={() => dismissNotification(notification.notificationId)}
                                                    >
                                                        {t('notificationPopup.dismiss')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div role="button" className="p-3 text-center text-tory-blue text-sm font-medium cursor-pointer" onClick={viewAllNotifications} tabIndex="0" onKeyDown={(e) => onPressEnterKey(e, viewAllNotifications)}>
                                        {t('notificationPopup.viewAllNotification')}
                                    </div>
                                </>
                                ) : (
                                    <div className="cursor-default">
                                        <div className="flex flex-col items-center py-16 px-2 border-b border-gray-200">
                                            <img src={noNotificationIcon} alt='' id='noNotificationIcon' />
                                            <p className="text-sm text-gray-500">{t('notificationPopup.noNotification')}</p>
                                            <p className="text-sm text-gray-500">{t('notificationPopup.noNotificationDescr')}</p>
                                        </div>
                                        <button className="p-3 text-center text-gray-300 text-sm font-medium w-full cursor-default">
                                            {t('notificationPopup.viewAllNotification')}
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    )}
                </div>
            </FocusTrap>
        </div>
    );
}

export default NotificationPopup;