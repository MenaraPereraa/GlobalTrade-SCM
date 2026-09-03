package lk.menara.globaltrade.scm.bean.scheduled;

import jakarta.ejb.Schedule;
import jakarta.ejb.Stateless;
import jakarta.ejb.Timer;

@Stateless
public class CustomsTimerBean {

    @Schedule(hour = "*", minute = "*/30", persistent = false)
    public void checkPendingCustomsDeadlines(Timer timer) {
    }
}